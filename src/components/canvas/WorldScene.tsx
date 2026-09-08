import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { audioEngine } from '../../audio/AudioEngine';

interface WorldSceneProps {
  scrollProgress: number;
  isScrolling: boolean;
  onCheckpointTrigger?: (checkpointId: number) => void;
  activeCheckpoint: number | null;
}

interface SnowParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  vz: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export const WorldScene: React.FC<WorldSceneProps> = ({
  scrollProgress,
  isScrolling,
  onCheckpointTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const threeMountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [baseLoaded, setBaseLoaded] = useState<boolean>(false);
  const [summitLoaded, setSummitLoaded] = useState<boolean>(false);
  const [, setCharacterLoaded] = useState<boolean>(false);

  // Animation and physics state
  const stateRef = useRef({
    time: 0,
    currentProgress: 0,
    targetProgress: 0,
    scrollVelocity: 0,
    lastProgress: 0,
    isScrolling: false,
    lastCheckpoint: -1,
    mouseX: 0,
    mouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    snow: [] as SnowParticle[],
    shooters: [] as ShootingStar[],
    ripples: [] as WaterRipple[],
  });

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') + '/';

  // Sync scroll progress into state ref
  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  // Track mouse for 3D parallax tilt & spotlight direction
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
    const ny = (e.clientY / window.innerHeight) * 2 - 1; // -1 to 1
    stateRef.current.mouseX = nx;
    stateRef.current.mouseY = ny;

    // Trigger subtle water ripple if cursor is over the lake area
    if (e.clientY > window.innerHeight * 0.60 && Math.random() < 0.15) {
      if (stateRef.current.ripples.length < 16) {
        stateRef.current.ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 2,
          maxRadius: 40 + Math.random() * 30,
          alpha: 0.35,
          speed: 0.8 + Math.random() * 0.6,
        });
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // ============================================================================
  // THREE.JS RIGGED 3D CHARACTER, PATHWAY & SPOTLIGHT SHADOW ENGINE
  // Adhering to .agents/skills/threejs-expert/ standards
  // ============================================================================
  useEffect(() => {
    const mount = threeMountRef.current;
    if (!mount) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene, Camera & WebGLRenderer Setup
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Camera positioned to frame the character on the LEFT third looking forward-right
    camera.position.set(-2.4, 1.4, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // 2. Three.js SpotLight System (Overhead Left targeting the character on the left)
    const spotLight = new THREE.SpotLight(0xe0f2fe, 36);
    spotLight.position.set(-3.6, 5.2, 3.2);
    spotLight.angle = Math.PI / 4.5;
    spotLight.penumbra = 0.85;       // Soft penumbra boundary
    spotLight.decay = 2.0;           // Inverse-square physical falloff
    spotLight.distance = 28;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 18;
    spotLight.shadow.bias = -0.0008;

    scene.add(spotLight);
    scene.add(spotLight.target);

    // Explorer Forward Headlamp Spotlight
    const headlamp = new THREE.SpotLight(0x7dd3fc, 20);
    headlamp.angle = Math.PI / 5;
    headlamp.penumbra = 0.9;
    headlamp.decay = 2.0;
    headlamp.distance = 20;
    headlamp.castShadow = false;
    scene.add(headlamp);
    scene.add(headlamp.target);

    // Ambient & Aurora Rim Lighting
    const ambientLight = new THREE.AmbientLight(0x071528, 1.2);
    scene.add(ambientLight);

    const auroraRimLight = new THREE.DirectionalLight(0x34d399, 1.6);
    auroraRimLight.position.set(4, 3, -2);
    scene.add(auroraRimLight);

    // 3. 3D MOUNTAIN PATHWAY (Custom Spline Geometry on the Left)
    // Mountain trail spline winding from foreground left into the pass
    const pathPoints = [
      new THREE.Vector3(-1.75, -0.02, 3.5),
      new THREE.Vector3(-1.72, 0.02, 0.5),
      new THREE.Vector3(-1.58, 0.16, -2.5),
      new THREE.Vector3(-1.42, 0.38, -5.5),
      new THREE.Vector3(-1.32, 0.65, -8.5),
      new THREE.Vector3(-1.25, 0.95, -11.5),
    ];
    const trailCurve = new THREE.CatmullRomCurve3(pathPoints);

    // Construct 3D Pathway Ribbon Mesh
    const pathCurvePoints = trailCurve.getPoints(60);
    const pathWidth = 1.35;
    const pathVertices: number[] = [];
    const pathIndices: number[] = [];
    const pathUvs: number[] = [];

    for (let i = 0; i < pathCurvePoints.length; i++) {
      const pt = pathCurvePoints[i];
      const tangent = trailCurve.getTangentAt(i / (pathCurvePoints.length - 1)).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const pLeft = pt.clone().add(normal.clone().multiplyScalar(-pathWidth * 0.5));
      const pRight = pt.clone().add(normal.clone().multiplyScalar(pathWidth * 0.5));

      pathVertices.push(pLeft.x, pLeft.y, pLeft.z);
      pathVertices.push(pRight.x, pRight.y, pRight.z);

      const v = i / (pathCurvePoints.length - 1);
      pathUvs.push(0, v, 1, v);

      if (i < pathCurvePoints.length - 1) {
        const base = i * 2;
        pathIndices.push(base, base + 1, base + 2);
        pathIndices.push(base + 1, base + 3, base + 2);
      }
    }

    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pathVertices, 3));
    pathGeo.setAttribute('uv', new THREE.Float32BufferAttribute(pathUvs, 2));
    pathGeo.setIndex(pathIndices);
    pathGeo.computeVertexNormals();

    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,          // Deep alpine slate/rock with frost
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.receiveShadow = true;
    pathMesh.castShadow = true;
    scene.add(pathMesh);

    // Trail border stones & trail cairn markers along the path edge
    const rockGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const snowCapMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      roughness: 0.95,
      metalness: 0.05,
    });

    const rocksGroup = new THREE.Group();
    // Place stones along both borders of the path
    for (let i = 2; i < pathCurvePoints.length - 2; i += 3) {
      const pt = pathCurvePoints[i];
      const tangent = trailCurve.getTangentAt(i / (pathCurvePoints.length - 1)).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left border stone
      const rMeshLeft = new THREE.Mesh(rockGeo, rockMat);
      const lPos = pt.clone().add(normal.clone().multiplyScalar(-pathWidth * 0.58));
      rMeshLeft.position.set(lPos.x, lPos.y + 0.06, lPos.z);
      rMeshLeft.scale.set(0.9 + Math.random() * 0.4, 0.7 + Math.random() * 0.5, 0.9 + Math.random() * 0.4);
      rMeshLeft.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rMeshLeft.castShadow = true;
      rMeshLeft.receiveShadow = true;
      rocksGroup.add(rMeshLeft);

      // Right border stone
      const rMeshRight = new THREE.Mesh(rockGeo, rockMat);
      const rPos = pt.clone().add(normal.clone().multiplyScalar(pathWidth * 0.58));
      rMeshRight.position.set(rPos.x, rPos.y + 0.06, rPos.z);
      rMeshRight.scale.set(0.8 + Math.random() * 0.5, 0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.5);
      rMeshRight.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      rMeshRight.castShadow = true;
      rMeshRight.receiveShadow = true;
      rocksGroup.add(rMeshRight);

      // Expedition Trail Cairn Marker at interval
      if (i === 11 || i === 29 || i === 47) {
        const markerPost = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.75, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
        );
        markerPost.position.set(lPos.x - 0.15, lPos.y + 0.35, lPos.z);
        markerPost.castShadow = true;
        rocksGroup.add(markerPost);

        // Subtle glowing trail beacon lantern on post
        const lanternLight = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        lanternLight.position.set(lPos.x - 0.15, lPos.y + 0.75, lPos.z);
        rocksGroup.add(lanternLight);
      }
    }
    scene.add(rocksGroup);

    // Transparent Shadow Floor (lets the photographic background plate show through)
    const floorGeo = new THREE.PlaneGeometry(35, 35);
    const floorMat = new THREE.ShadowMaterial({
      opacity: 0.65,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    // 4. Load Rigged 3D Character (Positioned on the LEFT pathway)
    let mixer: THREE.AnimationMixer | null = null;
    let idleAction: THREE.AnimationAction | null = null;
    let walkAction: THREE.AnimationAction | null = null;
    let runAction: THREE.AnimationAction | null = null;
    let characterModel: THREE.Group | null = null;

    const loader = new GLTFLoader();
    loader.load(
      `${baseUrl}Soldier.glb`,
      (gltf) => {
        characterModel = gltf.scene;
        characterModel.scale.set(1.42, 1.42, 1.42);
        characterModel.position.set(-1.75, 0, 0);
        characterModel.rotation.y = Math.PI * 0.15; // Angled forward-right into pass

        // Enable shadows across all skinned meshes and bones
        characterModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (m) {
              m.roughness = 0.65;
              m.metalness = 0.2;
            }
          }
        });

        // Set up Animation Mixer & locomotion clips
        mixer = new THREE.AnimationMixer(characterModel);
        const idleClip = gltf.animations.find((a) => a.name === 'Idle');
        const walkClip = gltf.animations.find((a) => a.name === 'Walk');
        const runClip = gltf.animations.find((a) => a.name === 'Run');

        if (idleClip) {
          idleAction = mixer.clipAction(idleClip);
          idleAction.setEffectiveWeight(1).play();
        }
        if (walkClip) {
          walkAction = mixer.clipAction(walkClip);
          walkAction.setEffectiveWeight(0).play();
        }
        if (runClip) {
          runAction = mixer.clipAction(runClip);
          runAction.setEffectiveWeight(0).play();
        }

        scene.add(characterModel);
        setCharacterLoaded(true);
      },
      undefined,
      (error) => {
        console.warn('Failed to load 3D character model:', error);
      }
    );

    // Resize handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 5. 3D Render Loop
    const clock = new THREE.Clock();

    const animateThree = () => {
      animId = requestAnimationFrame(animateThree);
      const delta = clock.getDelta();
      const st = stateRef.current;
      const p = st.currentProgress;
      const vel = st.scrollVelocity;

      // Update 3D Character Locomotion & Position on the Left Pathway
      if (characterModel && mixer) {
        const isMoving = vel > 0.06 && st.isScrolling;
        const targetIdleWeight = isMoving ? 0 : 1;
        const targetWalkWeight = isMoving && vel < 1.3 ? 1 : isMoving && vel >= 1.3 ? 0.3 : 0;
        const targetRunWeight = isMoving && vel >= 1.3 ? 0.7 : 0;

        if (idleAction) {
          const w = idleAction.getEffectiveWeight();
          idleAction.setEffectiveWeight(w + (targetIdleWeight - w) * 0.12);
        }
        if (walkAction) {
          const w = walkAction.getEffectiveWeight();
          walkAction.setEffectiveWeight(w + (targetWalkWeight - w) * 0.14);
          walkAction.timeScale = Math.max(0.7, Math.min(2.0, 0.9 + vel * 0.6));
        }
        if (runAction) {
          const w = runAction.getEffectiveWeight();
          runAction.setEffectiveWeight(w + (targetRunWeight - w) * 0.14);
          runAction.timeScale = Math.max(0.9, Math.min(2.2, 1.0 + vel * 0.4));
        }

        mixer.update(delta);

        // Advance character along the 3D pathway curve as scroll progresses
        const tPath = Math.min(0.98, Math.max(0.01, 0.08 + p * 0.85));
        const currentPathPt = trailCurve.getPointAt(tPath);
        const tangent = trailCurve.getTangentAt(tPath).normalize();

        characterModel.position.copy(currentPathPt);
        const lookTarget = currentPathPt.clone().add(tangent);
        characterModel.lookAt(lookTarget);

        // Position ground shadow floor beneath character
        floor.position.set(currentPathPt.x, currentPathPt.y - 0.01, currentPathPt.z);

        // Update spotlight target to illuminate character and pathway from overhead left
        spotLight.target.position.set(currentPathPt.x, currentPathPt.y + 1.1, currentPathPt.z);
        spotLight.position.set(
          currentPathPt.x - 1.8 + st.currentMouseX * 0.6,
          currentPathPt.y + 4.8,
          currentPathPt.z + 3.2 - st.currentMouseY * 0.4
        );

        // Explorer headlamp projecting forward along the pathway
        headlamp.position.set(currentPathPt.x, currentPathPt.y + 1.35, currentPathPt.z + 0.1);
        headlamp.target.position.copy(lookTarget.clone().add(new THREE.Vector3(0, -0.6, 0)));

        // Camera smoothly tracks character with subtle mouse parallax
        camera.position.x = -2.4 + st.currentMouseX * 0.35;
        camera.position.y = 1.4 + p * 0.45 - st.currentMouseY * 0.25;
        camera.position.z = 6.2 - p * 3.4;
        camera.lookAt(currentPathPt.x + 0.45, currentPathPt.y + 1.1, currentPathPt.z);
      }

      renderer.render(scene, camera);
    };

    animateThree();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      pathGeo.dispose();
      pathMat.dispose();
      rockGeo.dispose();
      rockMat.dispose();
      snowCapMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [baseUrl]);

  // ============================================================================
  // 2D CANVAS ATMOSPHERIC SHADERS & 3D BLIZZARD PARTICLES
  // Living GLSL Aurora ribbons, lake water ripples, and velocity particles
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    // Initialize 3D Blizzard snow particles
    const initBlizzard = () => {
      const count = Math.min(300, Math.round((W * H) / 3800));
      stateRef.current.snow = Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * W * 1.6,
        y: (Math.random() - 0.5) * H * 1.6,
        z: Math.random() * 950 + 50,
        size: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.65 + 0.35,
        vx: (Math.random() - 0.45) * 1.2,
        vy: Math.random() * 1.8 + 0.8,
        vz: Math.random() * 1.5 + 0.6,
      }));

      // Initialize pool of shooting stars
      stateRef.current.shooters = Array.from({ length: 4 }, () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        len: 0,
        life: 999,
        maxLife: 999,
        active: false,
      }));
    };

    initBlizzard();

    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initBlizzard();
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      const st = stateRef.current;
      st.time += 0.016;
      const t = st.time;

      // Smooth scroll lerp (buttery 60fps tracking)
      const prevProgress = st.currentProgress;
      st.currentProgress += (st.targetProgress - st.currentProgress) * 0.085;
      const p = Math.max(0, Math.min(1, st.currentProgress));

      // Calculate instantaneous scroll velocity
      const rawVel = Math.abs(p - prevProgress) * 60;
      st.scrollVelocity += (rawVel - st.scrollVelocity) * 0.15;
      const vel = st.scrollVelocity;

      // Footstep audio trigger when moving forward
      if (Math.abs(st.targetProgress - st.currentProgress) > 0.0015 && st.isScrolling) {
        audioEngine.playFootstep();
      }

      // Checkpoint arrival detection & audio chime trigger
      const checkpoints = [
        { id: 1, p: 0.25 },
        { id: 2, p: 0.55 },
        { id: 3, p: 0.80 },
        { id: 4, p: 1.00 },
      ];
      checkpoints.forEach(({ id, p: cpTarget }) => {
        if (Math.abs(p - cpTarget) < 0.04 && st.lastCheckpoint !== id) {
          st.lastCheckpoint = id;
          audioEngine.playCheckpointArrive();
          onCheckpointTrigger?.(id);
        }
      });
      if (p < 0.10) {
        st.lastCheckpoint = -1;
      }

      // Smooth mouse parallax lerp
      st.currentMouseX += (st.mouseX - st.currentMouseX) * 0.06;
      st.currentMouseY += (st.mouseY - st.currentMouseY) * 0.06;

      // Update 3D DOM camera dolly transform on the background container
      if (containerRef.current) {
        const dollyScale = 1.0 + p * 0.22;
        const dollyY = p * -35;
        const dollyZ = p * 50;
        const tiltX = -st.currentMouseY * 2.5;
        const tiltY = st.currentMouseX * 3.5;
        const panX = st.currentMouseX * 14;
        const panY = st.currentMouseY * 9;

        containerRef.current.style.transform = `
          perspective(1100px)
          translate3d(${panX}px, ${panY + dollyY}px, ${dollyZ}px)
          rotateX(${tiltX}deg)
          rotateY(${tiltY}deg)
          scale(${dollyScale})
        `;
      }

      ctx.clearRect(0, 0, W, H);

      /* ========================================================================
         1. LIVING GLSL AURORA WAVE RIBBONS (Upper Sky)
      ======================================================================== */
      const baseAlpha = Math.max(0, 1 - Math.max(0, (p - 0.70) / 0.22));
      if (baseAlpha > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const drawAuroraRibbon = (
          xStartFrac: number,
          xEndFrac: number,
          yBaseFrac: number,
          waveAmp: number,
          freq: number,
          speed: number,
          cTop: string,
          cMid: string,
          cBot: string,
          alphaMod: number
        ) => {
          const x0 = W * xStartFrac;
          const x1 = W * xEndFrac;
          const width = x1 - x0;
          const steps = 38;
          const stepW = width / steps;
          const yBase = H * yBaseFrac;

          ctx.globalAlpha = baseAlpha * alphaMod;

          for (let i = 0; i < steps; i++) {
            const progressX = i / steps;
            const x = x0 + i * stepW;

            const wave =
              Math.sin(progressX * freq + t * speed) * waveAmp +
              Math.cos(progressX * freq * 1.8 - t * speed * 0.7) * (waveAmp * 0.4) +
              Math.sin(t * speed * 1.4 + progressX * 4.0) * (waveAmp * 0.25);

            const yTop = Math.max(0, yBase + wave - 35);
            const yBottom = Math.min(H * 0.62, yBase + wave + H * 0.32);

            const rayAlpha =
              0.4 +
              0.35 * Math.sin(progressX * 6 + t * 2.2) +
              0.15 * Math.sin(t * 1.5 + progressX * 10);

            const grad = ctx.createLinearGradient(x, yTop, x, yBottom);
            grad.addColorStop(0.0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.12, cTop);
            grad.addColorStop(0.48, cMid);
            grad.addColorStop(0.85, cBot);
            grad.addColorStop(1.0, 'rgba(0,0,0,0)');

            ctx.fillStyle = grad;
            ctx.globalAlpha = baseAlpha * alphaMod * Math.max(0.1, rayAlpha);
            ctx.fillRect(x - stepW * 0.7, yTop, stepW * 1.4, yBottom - yTop);
          }
        };

        // Primary Emerald Ribbon
        drawAuroraRibbon(
          0.15, 0.85,
          0.06,
          H * 0.08,
          4.8, 1.2,
          'rgba(168, 85, 247, 0.55)',
          'rgba(52, 211, 153, 0.78)',
          'rgba(56, 189, 248, 0.60)',
          0.72
        );

        // Secondary Cyan Ribbon
        drawAuroraRibbon(
          0.30, 0.95,
          0.12,
          H * 0.06,
          3.6, 0.85,
          'rgba(244, 63, 94, 0.30)',
          'rgba(34, 211, 238, 0.70)',
          'rgba(16, 185, 129, 0.65)',
          0.60
        );

        // Lake bloom reflection
        const bloomY = H * 0.62;
        const lakeBloom = ctx.createRadialGradient(
          W * 0.55, bloomY + 45, 15,
          W * 0.52, bloomY + 180, W * 0.45
        );
        lakeBloom.addColorStop(0, 'rgba(52, 211, 153, 0.28)');
        lakeBloom.addColorStop(0.4, 'rgba(56, 189, 248, 0.18)');
        lakeBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lakeBloom;
        ctx.globalAlpha = baseAlpha * 0.65;
        ctx.fillRect(0, bloomY, W, H - bloomY);

        ctx.restore();
      }

      /* ========================================================================
         2. INTERACTIVE WATER RIPPLES (Lower Mirror Lake)
      ======================================================================== */
      if (baseAlpha > 0.1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        if (vel > 0.8 && Math.random() < 0.25) {
          stateRef.current.ripples.push({
            x: W * (0.3 + Math.random() * 0.5),
            y: H * (0.64 + Math.random() * 0.32),
            radius: 4,
            maxRadius: 60 + Math.random() * 50,
            alpha: 0.4,
            speed: 1.2 + vel * 0.4,
          });
        }

        st.ripples.forEach((r, idx) => {
          r.radius += r.speed;
          r.alpha *= 0.965;

          if (r.alpha < 0.01 || r.radius >= r.maxRadius) {
            st.ripples.splice(idx, 1);
            return;
          }

          ctx.strokeStyle = `rgba(56, 189, 248, ${r.alpha * baseAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.radius * 2.2, r.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Water glints
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 0.8;
        const waterTop = H * 0.62;
        for (let ry = waterTop + 15; ry < H; ry += 24) {
          const shiftX = Math.sin(ry * 0.05 + t * 1.6) * 16;
          const spanW = W * (0.5 + 0.5 * ((ry - waterTop) / (H - waterTop)));
          const cx = W * 0.55;
          ctx.beginPath();
          ctx.moveTo(cx - spanW * 0.4 + shiftX, ry);
          ctx.lineTo(cx + spanW * 0.4 + shiftX * 0.5, ry);
          ctx.stroke();
        }

        ctx.restore();
      }

      /* ========================================================================
         3. CELESTIAL SHOOTING STARS
      ======================================================================== */
      if (Math.random() < 0.007) {
        const idle = st.shooters.find((s) => !s.active);
        if (idle) {
          idle.x = W * (0.15 + Math.random() * 0.55);
          idle.y = H * (0.02 + Math.random() * 0.25);
          const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
          const speed = 10 + Math.random() * 8;
          idle.vx = Math.cos(angle) * speed;
          idle.vy = Math.sin(angle) * speed;
          idle.len = 70 + Math.random() * 80;
          idle.life = 0;
          idle.maxLife = 45;
          idle.active = true;
        }
      }

      st.shooters.forEach((s) => {
        if (!s.active) return;
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const progress = s.life / s.maxLife;
        const starAlpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = starAlpha * 0.85;

        const grad = ctx.createLinearGradient(s.x - s.vx * 6, s.y - s.vy * 6, s.x, s.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(224,242,254,0.95)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 5, s.y - s.vy * 5);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();

        if (s.life >= s.maxLife) s.active = false;
      });

      /* ========================================================================
         4. 3D BLIZZARD SNOW PARTICLES (Velocity Acceleration)
      ======================================================================== */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const cx = W / 2;
      const cy = H / 2;
      const forwardVelocity = 1.0 + vel * 26.0;

      st.snow.forEach((p3d) => {
        p3d.z -= p3d.vz * forwardVelocity;
        p3d.x += p3d.vx + Math.sin(t * 1.2 + p3d.y * 0.01) * 0.6;
        p3d.y += p3d.vy;

        if (p3d.z <= 20) {
          p3d.z = 950 + Math.random() * 100;
          p3d.x = (Math.random() - 0.5) * W * 1.6;
          p3d.y = (Math.random() - 0.5) * H * 1.6;
        }
        if (p3d.y > H * 1.2) {
          p3d.y = -H * 0.2;
          p3d.x = (Math.random() - 0.5) * W * 1.6;
        }

        const focalLength = 480;
        const scale = focalLength / p3d.z;
        const screenX = cx + p3d.x * scale;
        const screenY = cy + p3d.y * scale;

        if (screenX < -20 || screenX > W + 20 || screenY < -20 || screenY > H + 20) {
          return;
        }

        const radius = Math.max(0.4, p3d.size * scale);
        const depthAlpha =
          p3d.z < 80
            ? (p3d.z / 80) * p3d.alpha
            : Math.min(1, (1000 - p3d.z) / 450) * p3d.alpha;

        ctx.globalAlpha = depthAlpha * 0.85;

        if (vel > 0.4 && p3d.z < 350) {
          const streakLen = Math.min(18, vel * 12 * scale);
          const streakGrad = ctx.createLinearGradient(
            screenX, screenY,
            screenX + p3d.vx * streakLen, screenY + p3d.vy * streakLen + streakLen
          );
          streakGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
          streakGrad.addColorStop(1, 'rgba(186,230,253,0.1)');
          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = radius * 0.8;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + p3d.vx * streakLen, screenY + p3d.vy * streakLen + streakLen);
          ctx.stroke();
        } else {
          ctx.fillStyle = p3d.z < 300 ? '#ffffff' : '#bae6fd';
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();

      /* ========================================================================
         5. SUMMIT BEACON LENS FLARE GLOW (Apex @ 100%)
      ======================================================================== */
      const summitAlpha = Math.min(1, Math.max(0, (p - 0.72) / 0.20));
      if (summitAlpha > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const beaconX = W * 0.547;
        const beaconY = H * 0.448;
        const pulse = 1.0 + 0.18 * Math.sin(t * 3.5);
        const beaconRadius = 45 * pulse;

        const beaconGlow = ctx.createRadialGradient(
          beaconX, beaconY, 2,
          beaconX, beaconY, beaconRadius
        );
        beaconGlow.addColorStop(0, 'rgba(255, 235, 150, 0.95)');
        beaconGlow.addColorStop(0.25, 'rgba(245, 158, 11, 0.55)');
        beaconGlow.addColorStop(0.65, 'rgba(217, 119, 6, 0.20)');
        beaconGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = beaconGlow;
        ctx.globalAlpha = summitAlpha * 0.85;
        ctx.beginPath();
        ctx.arc(beaconX, beaconY, beaconRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [onCheckpointTrigger]);

  // Plate opacities for continuous elevation ascent
  const baseAlpha = Math.max(0, 1 - Math.max(0, (scrollProgress - 0.70) / 0.20));
  const summitAlpha = Math.min(1, Math.max(0, (scrollProgress - 0.72) / 0.20));

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden select-none pointer-events-none bg-[#01030a] z-0">
      
      {/* 1. PHOTOREALISTIC AURORA MOUNTAIN BACKDROP STAGE */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Baseplate: 8K Photorealistic Aurora Mountain */}
        <div
          className="absolute inset-[-4%] w-[108%] h-[108%] transition-opacity duration-700"
          style={{ opacity: baseAlpha }}
        >
          <img
            src={`${baseUrl}aurora_mountain.jpg`}
            alt="Photorealistic Aurora Mountain"
            className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
              baseLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setBaseLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#01030a]/80 via-transparent to-[#01030a]/30 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(1,3,10,0.75)_100%)] pointer-events-none" />
        </div>

        {/* Summit Plate: 8K Photorealistic Mountain Summit Apex Beacon */}
        <div
          className="absolute inset-[-4%] w-[108%] h-[108%] transition-opacity duration-700"
          style={{ opacity: summitAlpha }}
        >
          <img
            src={`${baseUrl}monoio_summit_beacon.jpg`}
            alt="Photorealistic Mountain Summit Beacon"
            className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
              summitLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setSummitLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#01030a]/85 via-transparent to-[#01030a]/50 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(1,3,10,0.8)_100%)] pointer-events-none" />
        </div>
      </div>

      {/* 2. THREE.JS RIGGED 3D CHARACTER, PATHWAY & SPOTLIGHT SHADOW LAYER */}
      <div
        ref={threeMountRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 3. DYNAMIC ATMOSPHERIC SHADER & BLIZZARD CANVAS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      {/* 4. RIGHT VOID SHADOW GRADIENT (Preserves 100% WCAG AAA readability for right-docked cards) */}
      <div
        className="absolute inset-y-0 right-0 w-full sm:w-2/3 md:w-1/2 lg:w-5/12 bg-gradient-to-l from-[#01030a]/90 via-[#01030a]/50 to-transparent pointer-events-none z-30"
      />
    </div>
  );
};
