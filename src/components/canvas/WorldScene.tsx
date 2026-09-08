import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

interface WorldSceneProps {
  scrollProgress: number;
  isScrolling: boolean;
  onCheckpointTrigger?: (checkpointId: number) => void;
  activeCheckpoint: number | null;
}

export const WorldScene: React.FC<WorldSceneProps> = ({
  scrollProgress,
  isScrolling,
  onCheckpointTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    scrollProgress: 0,
    targetProgress: 0,
    time: 0,
    walkPhase: 0,
    velocity: 0,
    lastProgress: 0,
    isScrolling: false,
    lastArrivedCheckpoint: -1,
    footsteps: [] as { x: number; y: number; z: number; rotY: number; mesh: THREE.Mesh }[],
    snowParticles: [] as { x: number; y: number; z: number; vx: number; vy: number; vz: number }[],
    shootingStars: [] as {
      start: THREE.Vector3;
      dir: THREE.Vector3;
      progress: number;
      speed: number;
      active: boolean;
      tail: THREE.Line;
      head: THREE.Mesh;
    }[],
    fireEmbers: [] as { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }[],
  });

  // Keep target progress synced
  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. THREE.JS SCENE, CAMERA & RENDERER SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x01030a);
    scene.fog = new THREE.FogExp2(0x01030a, 0.016);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. TRAIL SPLINE PATH (Continuous 230-Unit Mountain Ascent) ---
    // Smooth 3D spline winding from bottom-right (start) up through the mountain pass
    const splinePoints = [
      new THREE.Vector3(2.6, 0.0, 8.0),       // Scene 0: Trailhead Entrance (0%)
      new THREE.Vector3(2.0, 0.6, -16.0),     // Canyon bend
      new THREE.Vector3(1.3, 1.8, -44.0),     // Checkpoint 1: Signpost of Mastery (25%)
      new THREE.Vector3(0.4, 3.4, -74.0),     // Frozen gorge ridge
      new THREE.Vector3(-0.6, 5.5, -106.0),   // Checkpoint 2: Mountain Campsite (55%)
      new THREE.Vector3(0.1, 7.8, -138.0),    // Glacial crest ascent
      new THREE.Vector3(1.1, 10.5, -168.0),   // Checkpoint 3: Ancient Observatory Arch (80%)
      new THREE.Vector3(0.5, 13.8, -198.0),   // Knife-edge summit ridge
      new THREE.Vector3(0.0, 16.5, -226.0),   // Checkpoint 4: Summit Beacon Apex (100%)
    ];
    const trailCurve = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal', 0.5);

    // --- 3. ATMOSPHERIC LIGHTING SYSTEM ---
    const ambientLight = new THREE.AmbientLight(0x0a1628, 1.4);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x1e3a5f, 0x030712, 1.2);
    scene.add(hemisphereLight);

    // Stark directional moonlight with sharp realistic shadow mapping
    const moonLight = new THREE.DirectionalLight(0xdbeafe, 2.6);
    moonLight.position.set(-35, 55, -45);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 180;
    moonLight.shadow.camera.left = -45;
    moonLight.shadow.camera.right = 45;
    moonLight.shadow.camera.top = 45;
    moonLight.shadow.camera.bottom = -45;
    moonLight.shadow.bias = -0.0004;
    scene.add(moonLight);

    // Aurora atmospheric pointlights casting ambient cyan/emerald tint
    const auroraLight1 = new THREE.PointLight(0x00ff9d, 2.8, 85);
    auroraLight1.position.set(35, 45, -60);
    scene.add(auroraLight1);

    const auroraLight2 = new THREE.PointLight(0x00e5ff, 2.4, 95);
    auroraLight2.position.set(50, 60, -130);
    scene.add(auroraLight2);

    // --- 4. CELESTIAL SKY & VOLUMETRIC AURORA ---
    // 4A. Hyper-Realistic Moon with Volumetric Coronas
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-45, 52, -140);

    const moonGeo = new THREE.SphereGeometry(6.4, 48, 48);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.55,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);

    // Multi-Layered Volumetric Lunar Halo Rings
    const haloGeo1 = new THREE.PlaneGeometry(42, 42);
    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo1 = new THREE.Mesh(haloGeo1, haloMat1);
    moonHalo1.position.z += 0.2;
    moonGroup.add(moonHalo1);

    const haloGeo2 = new THREE.PlaneGeometry(75, 75);
    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo2 = new THREE.Mesh(haloGeo2, haloMat2);
    moonHalo2.position.z += 0.1;
    moonGroup.add(moonHalo2);

    scene.add(moonGroup);

    // 4B. GLSL Volumetric Aurora Borealis Curtains (Biased to Right Sky)
    const auroraGeo = new THREE.CylinderGeometry(180, 180, 75, 96, 36, true);
    const auroraUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x00ff9d) }, // Arctic emerald
      uColor2: { value: new THREE.Color(0x00f0ff) }, // Glacial cyan
      uColor3: { value: new THREE.Color(0x8b5cf6) }, // Astral violet
    };

    const auroraMat = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;

        void main() {
          vUv = uv;
          vPos = position;
          vec3 pos = position;

          // Organic harmonic wave physics biased toward right side (+X)
          float rightWeight = smoothstep(-50.0, 90.0, pos.x);
          float wave1 = sin(pos.x * 0.03 + uTime * 0.6) * 6.5 * rightWeight;
          float wave2 = cos(pos.z * 0.035 + uTime * 0.45) * 5.0 * rightWeight;
          float wave3 = sin(pos.x * 0.07 + pos.z * 0.05 + uTime * 0.85) * 3.2;

          pos.y += wave1 + wave2 + wave3;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;

        void main() {
          // Vertical feathering
          float vFade = smoothstep(0.0, 0.42, vUv.y) * smoothstep(1.0, 0.58, vUv.y);

          // Right side concentration
          float sideBias = smoothstep(-40.0, 80.0, vPos.x);

          // Raymarched curtain ripples
          float ripple = sin(vPos.x * 0.08 + uTime * 0.95 + sin(vPos.z * 0.04) * 3.0);
          ripple = smoothstep(-0.2, 0.85, ripple);

          // Dynamic multi-color blend
          vec3 col = mix(uColor1, uColor2, sin(vUv.x * 6.28 + uTime * 0.25) * 0.5 + 0.5);
          col = mix(col, uColor3, cos(vPos.z * 0.03 + uTime * 0.35) * 0.5 + 0.5);

          float alpha = vFade * ripple * sideBias * 0.75;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.position.set(25, 45, -90);
    scene.add(auroraMesh);

    // 4C. High-Density Starfield
    const starCount = 3600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 220 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.88 + 0.12);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi) + 15;
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Temperature colors
      const r = Math.random();
      if (r > 0.8) {
        starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.88; starColors[i * 3 + 2] = 1.0;
      } else if (r > 0.6) {
        starColors[i * 3] = 0.85; starColors[i * 3 + 1] = 0.75; starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4D. Shooting Stars
    const shootingStarMat = new THREE.LineBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const initShootingStars = () => {
      const stars = [];
      for (let i = 0; i < 3; i++) {
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(lineGeo, shootingStarMat);
        line.visible = false;
        scene.add(line);

        const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        head.visible = false;
        scene.add(head);

        stars.push({
          start: new THREE.Vector3(),
          dir: new THREE.Vector3(),
          progress: 1,
          speed: 0.025,
          active: false,
          tail: line,
          head,
        });
      }
      stateRef.current.shootingStars = stars;
    };
    initShootingStars();

    // --- 5. REALISTIC GLACIATED MOUNTAIN CANYON & TRAIL TERRAIN ---
    // 5A. Towering Jagged Mountain Backdrops
    const createMountainPeak = (
      x: number,
      y: number,
      z: number,
      radius: number,
      height: number,
      isSummit = false
    ) => {
      const geo = new THREE.ConeGeometry(radius, height, 10, 5);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vy = pos.getY(i);
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        if (vy < height * 0.48) {
          const noise = Math.sin(vx * 0.35) * Math.cos(vz * 0.35) * (radius * 0.16);
          pos.setX(i, vx + noise);
          pos.setZ(i, vz + noise);
        }
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: isSummit ? 0x182a44 : 0x0e1c31,
        roughness: 0.82,
        metalness: 0.18,
        flatShading: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + height / 2, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // Mountain canyon ridgelines
    createMountainPeak(0, 18, -250, 65, 95, true);       // Summit Apex
    createMountainPeak(-60, 8, -120, 52, 68);            // Left mountain ridge
    createMountainPeak(60, 9, -130, 55, 72);             // Right mountain ridge
    createMountainPeak(-38, 5, -60, 35, 48);             // Mid-left crag
    createMountainPeak(40, 6, -70, 36, 52);              // Mid-right crag
    createMountainPeak(-75, 4, -200, 58, 65);            // Far left horizon
    createMountainPeak(75, 5, -210, 60, 70);             // Far right horizon

    // 5B. Mountain Trail Ground Surface (Continuous 260m Valley Floor)
    const terrainGeo = new THREE.PlaneGeometry(110, 260, 64, 96);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainPos = terrainGeo.attributes.position;
    for (let i = 0; i < terrainPos.count; i++) {
      const px = terrainPos.getX(i);
      const pz = terrainPos.getZ(i);

      // Natural ascent slope
      const slope = (-pz + 10) * 0.082;
      const hills = Math.sin(px * 0.14) * Math.cos(pz * 0.08) * 2.2 + Math.sin(px * 0.28 + pz * 0.15) * 1.1;

      // Carve central trail valley
      const pathDist = Math.abs(px - Math.sin(pz * 0.04) * 2.5);
      const valley = Math.min(1.0, pathDist * 0.28);

      terrainPos.setY(i, (slope + hills) * valley);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0e1a2f, // Deep glacial rock & hard-packed snow
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, 0, -110);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 5C. Winding Beaten Snow Track Ribbon
    const trailSegments = 160;
    const trailWidth = 1.8;
    const trailRibbonGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailSegments * 2 * 3);

    for (let i = 0; i < trailSegments; i++) {
      const u = i / (trailSegments - 1);
      const pt = trailCurve.getPoint(u);
      const tangent = trailCurve.getTangent(u);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(trailWidth * 0.5));
      const right = pt.clone().add(normal.clone().multiplyScalar(-trailWidth * 0.5));

      trailPositions[i * 6] = left.x;
      trailPositions[i * 6 + 1] = left.y + 0.03;
      trailPositions[i * 6 + 2] = left.z;

      trailPositions[i * 6 + 3] = right.x;
      trailPositions[i * 6 + 4] = right.y + 0.03;
      trailPositions[i * 6 + 5] = right.z;
    }
    trailRibbonGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailIndices = [];
    for (let i = 0; i < trailSegments - 1; i++) {
      const base = i * 2;
      trailIndices.push(base, base + 1, base + 2);
      trailIndices.push(base + 1, base + 3, base + 2);
    }
    trailRibbonGeo.setIndex(trailIndices);
    trailRibbonGeo.computeVertexNormals();

    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x1e3656, // Beaten icy snow track
      roughness: 0.55,
      metalness: 0.28,
      side: THREE.DoubleSide,
    });
    const trailRibbon = new THREE.Mesh(trailRibbonGeo, trailMat);
    trailRibbon.receiveShadow = true;
    scene.add(trailRibbon);

    // 5D. 3D Blizzard Snow Crystals (Depth Particle Engine)
    const blizzardCount = 2000;
    const blizzardGeo = new THREE.BufferGeometry();
    const blizzardPositions = new Float32Array(blizzardCount * 3);
    const blizzardVelocities = new Float32Array(blizzardCount * 3);

    for (let i = 0; i < blizzardCount; i++) {
      blizzardPositions[i * 3] = (Math.random() - 0.5) * 80;
      blizzardPositions[i * 3 + 1] = Math.random() * 35;
      blizzardPositions[i * 3 + 2] = (Math.random() - 0.5) * 240 - 90;

      blizzardVelocities[i * 3] = -0.06 - Math.random() * 0.08;
      blizzardVelocities[i * 3 + 1] = -0.04 - Math.random() * 0.04;
      blizzardVelocities[i * 3 + 2] = -0.03 - Math.random() * 0.04;
    }
    blizzardGeo.setAttribute('position', new THREE.BufferAttribute(blizzardPositions, 3));

    const blizzardMat = new THREE.PointsMaterial({
      color: 0xdbeafe,
      size: 0.42,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const blizzardPoints = new THREE.Points(blizzardGeo, blizzardMat);
    scene.add(blizzardPoints);

    // --- 6. PHYSICAL 3D CHECKPOINT LANDMARKS ALONG THE PATH ---

    // 6A. Trailhead Basecamp (p = 0.00)
    const basecampGroup = new THREE.Group();
    const basecampPos = trailCurve.getPoint(0.0);
    basecampGroup.position.copy(basecampPos).add(new THREE.Vector3(-1.8, 0, -1.0));

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.7 });

    const basePost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8), woodMat);
    basePost.position.y = 1.1;
    basePost.castShadow = true;
    basecampGroup.add(basePost);

    const baseCrate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), woodMat);
    baseCrate.position.set(0.6, 0.3, 0);
    baseCrate.castShadow = true;
    basecampGroup.add(baseCrate);

    const baseLantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    baseLantern.position.set(0, 2.1, 0.2);
    basecampGroup.add(baseLantern);

    const baseLight = new THREE.PointLight(0x38bdf8, 3.2, 10);
    baseLight.position.copy(baseLantern.position);
    basecampGroup.add(baseLight);
    scene.add(basecampGroup);

    // 6B. Checkpoint 1: Signpost of Mastery (p = 0.25)
    const cp1Group = new THREE.Group();
    const cp1Pos = trailCurve.getPoint(0.25);
    cp1Group.position.copy(cp1Pos).add(new THREE.Vector3(-1.8, 0, -0.4));

    const cp1Post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 8), woodMat);
    cp1Post.position.y = 1.3;
    cp1Post.castShadow = true;
    cp1Group.add(cp1Post);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.09), woodMat);
    signBoard.position.set(0.4, 2.0, 0);
    signBoard.rotation.z = -0.05;
    signBoard.castShadow = true;
    cp1Group.add(signBoard);

    const cp1Lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    cp1Lantern.position.set(0.5, 1.6, 0.2);
    cp1Group.add(cp1Lantern);

    const cp1Light = new THREE.PointLight(0x38bdf8, 4.0, 10);
    cp1Light.position.copy(cp1Lantern.position);
    cp1Group.add(cp1Light);

    const cp1Ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.65, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    cp1Ring.position.set(0, 3.0, 0);
    cp1Ring.rotation.x = Math.PI / 2;
    cp1Group.add(cp1Ring);
    scene.add(cp1Group);

    // 6C. Checkpoint 2: Mountain Shelter Campsite (p = 0.55)
    const cp2Group = new THREE.Group();
    const cp2Pos = trailCurve.getPoint(0.55);
    cp2Group.position.copy(cp2Pos).add(new THREE.Vector3(-2.6, 0, -0.8));

    // A-frame high-altitude tent
    const tentGeo = new THREE.ConeGeometry(2.2, 2.8, 4, 1);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.92 });
    const tentMesh = new THREE.Mesh(tentGeo, tentMat);
    tentMesh.position.y = 1.4;
    tentMesh.rotation.y = Math.PI / 4;
    tentMesh.castShadow = true;
    cp2Group.add(tentMesh);

    // Campfire with animated ember particles & warm flickering light
    const fireMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32), new THREE.MeshBasicMaterial({ color: 0xff7b00 }));
    fireMesh.position.set(1.8, 0.25, 1.0);
    cp2Group.add(fireMesh);

    const campfireLight = new THREE.PointLight(0xff8c00, 6.0, 15);
    campfireLight.position.copy(fireMesh.position);
    campfireLight.position.y += 0.4;
    cp2Group.add(campfireLight);
    scene.add(cp2Group);

    // 6D. Checkpoint 3: Ancient Stone Observatory Arch (p = 0.80)
    const cp3Group = new THREE.Group();
    const cp3Pos = trailCurve.getPoint(0.80);
    cp3Group.position.copy(cp3Pos).add(new THREE.Vector3(2.2, 0, -0.6));

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, flatShading: true });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.8, 0.6), stoneMat);
    p1.position.set(-1.2, 1.9, 0);
    p1.castShadow = true;
    cp3Group.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.8, 0.6), stoneMat);
    p2.position.set(1.2, 1.9, 0);
    p2.castShadow = true;
    cp3Group.add(p2);

    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 0.7), stoneMat);
    archLintel.position.set(0, 3.9, 0);
    archLintel.castShadow = true;
    cp3Group.add(archLintel);

    const crystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    crystalMesh.position.set(0, 2.5, 0);
    cp3Group.add(crystalMesh);

    const crystalLight = new THREE.PointLight(0xc084fc, 5.0, 12);
    crystalLight.position.copy(crystalMesh.position);
    cp3Group.add(crystalLight);
    scene.add(cp3Group);

    // 6E. Checkpoint 4: Summit Beacon Apex Cairn (p = 1.00)
    const cp4Group = new THREE.Group();
    const cp4Pos = trailCurve.getPoint(1.0);
    cp4Group.position.copy(cp4Pos).add(new THREE.Vector3(0, 0, -1.8));

    const cairnMesh = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 7), stoneMat);
    cairnMesh.position.y = 1.1;
    cairnMesh.castShadow = true;
    cp4Group.add(cairnMesh);

    const summitBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    summitBeacon.position.set(0, 2.6, 0);
    cp4Group.add(summitBeacon);

    const summitLight = new THREE.PointLight(0xfef08a, 7.5, 22);
    summitLight.position.copy(summitBeacon.position);
    cp4Group.add(summitLight);
    scene.add(cp4Group);

    // --- 7. ARTICULATED MOUNTAINEER CHARACTER RIG ---
    // Strictly framed on the RIGHT side of the camera, facing forward along the trail
    const characterGroup = new THREE.Group();
    characterGroup.castShadow = true;

    const parkaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.12 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const gearMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    // 7A. Torso & Head
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.82, 12), parkaMat);
    torsoMesh.position.y = 1.15;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    const furCollar = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 8, 16), furMat);
    furCollar.position.set(0, 1.55, 0);
    furCollar.rotation.x = Math.PI / 2;
    characterGroup.add(furCollar);

    const hoodMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), parkaMat);
    hoodMesh.position.set(0, 1.72, 0);
    hoodMesh.castShadow = true;
    characterGroup.add(hoodMesh);

    // 7B. Technical Expedition Pack with Bedroll
    const packMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.28), gearMat);
    packMesh.position.set(0, 1.22, -0.25);
    packMesh.castShadow = true;
    characterGroup.add(packMesh);

    const bedrollMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.85 }));
    bedrollMesh.position.set(0, 1.58, -0.25);
    bedrollMesh.rotation.z = Math.PI / 2;
    characterGroup.add(bedrollMesh);

    // 7C. Swinging Storm Lantern on Backpack Pendulum
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(0.22, 0.95, -0.36);

    const lanternMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    lanternGroup.add(lanternMesh);

    const lanternLight = new THREE.PointLight(0x38bdf8, 3.2, 6.0);
    lanternGroup.add(lanternLight);
    characterGroup.add(lanternGroup);

    // 7D. Articulated Legs & Boots
    const legGeo = new THREE.CylinderGeometry(0.1, 0.088, 0.72, 8);
    const bootGeo = new THREE.BoxGeometry(0.17, 0.22, 0.32);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.16, 0.8, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, parkaMat);
    leftLegMesh.position.y = -0.34;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(0, -0.7, 0.05);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);
    characterGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, 0.8, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, parkaMat);
    rightLegMesh.position.y = -0.34;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0, -0.7, 0.05);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);
    characterGroup.add(rightLeg);

    // 7E. Articulated Arms & Trekking Staff
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.68, 8);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.36, 1.45, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, parkaMat);
    leftArmMesh.position.y = -0.31;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    characterGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.36, 1.45, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, parkaMat);
    rightArmMesh.position.y = -0.31;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);

    // Carbon-fiber Trekking Staff
    const staffMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.55, 8), ironMat);
    staffMesh.position.set(0.08, -0.32, 0.22);
    staffMesh.rotation.x = -0.25;
    rightArm.add(staffMesh);
    characterGroup.add(rightArm);

    scene.add(characterGroup);

    // Initial character position
    const startPoint = trailCurve.getPoint(0);
    characterGroup.position.copy(startPoint);
    characterGroup.lookAt(trailCurve.getPoint(0.015));

    // --- 8. FOOTPRINT DECAL SYSTEM ---
    const footprintGeo = new THREE.PlaneGeometry(0.16, 0.28);
    footprintGeo.rotateX(-Math.PI / 2);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x091424,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    const spawnFootstep = (pos: THREE.Vector3, rotY: number) => {
      const mesh = new THREE.Mesh(footprintGeo, footprintMat);
      mesh.position.copy(pos);
      mesh.position.y += 0.035;
      mesh.rotation.y = rotY;
      scene.add(mesh);

      stateRef.current.footsteps.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotY,
        mesh,
      });

      // Keep maximum 50 footprints in memory
      if (stateRef.current.footsteps.length > 50) {
        const oldest = stateRef.current.footsteps.shift();
        if (oldest) {
          scene.remove(oldest.mesh);
          oldest.mesh.geometry.dispose();
        }
      }
    };

    // --- 9. ANIMATION & LOCOMOTION RENDER LOOP ---
    let animFrameId: number;
    let lastStepTime = 0;

    const animate = () => {
      const state = stateRef.current;
      state.time += 0.016;
      const t = state.time;

      // Update GLSL Aurora time uniform
      auroraUniforms.uTime.value = t;

      // Smooth scroll lerp (Apple critically damped spring feel)
      const dScroll = state.targetProgress - state.scrollProgress;
      state.scrollProgress += dScroll * 0.092;
      state.velocity = (state.scrollProgress - state.lastProgress) * 60;
      state.lastProgress = state.scrollProgress;

      const p = Math.max(0, Math.min(1, state.scrollProgress));
      const speed = Math.abs(state.velocity);
      const isMoving = speed > 0.008;

      // Update Character World Position along 3D Catmull-Rom Spline
      const currentPoint = trailCurve.getPoint(p);
      const lookAheadP = Math.min(1.0, p + 0.015);
      const targetLook = trailCurve.getPoint(lookAheadP);

      characterGroup.position.copy(currentPoint);
      characterGroup.lookAt(targetLook.x, currentPoint.y, targetLook.z);

      // --- KINEMATIC LOCOMOTION GAIT ENGINE ---
      if (isMoving) {
        // WALKING STRIDE
        state.walkPhase += speed * 4.8 + 0.075;
        const phase = state.walkPhase;

        // Leg stride
        leftLeg.rotation.x = Math.sin(phase) * 0.75;
        rightLeg.rotation.x = -Math.sin(phase) * 0.75;

        // Arm counter-swing
        leftArm.rotation.x = -Math.sin(phase) * 0.6;
        rightArm.rotation.x = Math.sin(phase) * 0.52;

        // Vertical spine bounce & forward mountain lean
        torsoMesh.position.y = 1.15 + Math.abs(Math.sin(phase)) * 0.07;
        hoodMesh.position.y = 1.72 + Math.abs(Math.sin(phase)) * 0.07;
        packMesh.position.y = 1.22 + Math.abs(Math.sin(phase)) * 0.08;
        characterGroup.rotation.x = 0.08; // Lean into the climb
        characterGroup.rotation.z = Math.sin(phase) * 0.04; // Pelvic hip sway

        // Lantern pendulum momentum
        lanternGroup.position.x = 0.22 + Math.sin(phase * 1.5) * 0.06;

        // Footstep audio and footprint placement on footstrike
        if (Math.abs(Math.sin(phase)) > 0.92 && t - lastStepTime > 0.25) {
          lastStepTime = t;
          audioEngine.playFootstep();
          const isLeft = Math.sin(phase) > 0;
          const stepOffset = new THREE.Vector3(isLeft ? -0.18 : 0.18, 0, 0);
          stepOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterGroup.rotation.y);
          spawnFootstep(currentPoint.clone().add(stepOffset), characterGroup.rotation.y);
        }
      } else {
        // LIFELIKE IDLE BREATHING & WEIGHT SHIFT
        const breath = Math.sin(t * 2.2) * 0.025;
        torsoMesh.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath);

        const weightShift = Math.sin(t * 0.75) * 0.045;
        leftLeg.rotation.z = weightShift * 0.6;
        rightLeg.rotation.z = -weightShift * 0.6;
        leftLeg.rotation.x = 0.06;
        rightLeg.rotation.x = -0.06;

        hoodMesh.rotation.y = Math.sin(t * 0.4) * 0.22;
        hoodMesh.rotation.x = -0.05 + Math.cos(t * 0.45) * 0.08;

        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.06, 0.1);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.08, 0.1);
        characterGroup.rotation.z = THREE.MathUtils.lerp(characterGroup.rotation.z, 0, 0.1);
        characterGroup.rotation.x = THREE.MathUtils.lerp(characterGroup.rotation.x, 0.02, 0.1);

        lanternGroup.position.x = 0.22 + Math.sin(t * 2.5) * 0.028;
      }

      // --- SPRING-DAMPED FOLLOW CAMERA (Apple HIG Damping 1.0, Response 0.35) ---
      // Third-person view framed on the RIGHT side of the screen
      const isMobile = window.innerWidth < 768;
      const camSideOffset = isMobile ? 0.2 : -1.45; // Shifts camera left so traveler is on the right
      const camHeight = isMobile ? 1.7 : 1.95;
      const camDistance = isMobile ? 4.2 : 4.8;

      const camTangent = trailCurve.getTangent(p);
      const camNormal = new THREE.Vector3(-camTangent.z, 0, camTangent.x).normalize();

      const targetCamPos = currentPoint.clone()
        .sub(camTangent.clone().multiplyScalar(camDistance))
        .add(camNormal.clone().multiplyScalar(camSideOffset));
      targetCamPos.y += camHeight;

      // Smooth critically damped camera tracking
      camera.position.lerp(targetCamPos, 0.088);

      const lookTarget = currentPoint.clone().add(camTangent.clone().multiplyScalar(6.5));
      lookTarget.y += 1.45;
      camera.lookAt(lookTarget);

      // --- BLIZZARD SNOW PARTICLE DRIFT ---
      const blizzardPos = blizzardGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < blizzardCount; i++) {
        blizzardPos[i * 3] += blizzardVelocities[i * 3];
        blizzardPos[i * 3 + 1] += blizzardVelocities[i * 3 + 1];
        blizzardPos[i * 3 + 2] += blizzardVelocities[i * 3 + 2];

        // Wrap around camera
        if (blizzardPos[i * 3 + 1] < camera.position.y - 8) {
          blizzardPos[i * 3 + 1] = camera.position.y + 22;
          blizzardPos[i * 3] = camera.position.x + (Math.random() - 0.5) * 65;
          blizzardPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 65;
        }
      }
      blizzardGeo.attributes.position.needsUpdate = true;

      // --- SHOOTING STARS ENGINE ---
      state.shootingStars.forEach((star) => {
        if (!star.active && Math.random() < 0.003) {
          star.active = true;
          star.progress = 0;
          star.start.set(
            camera.position.x + (Math.random() - 0.5) * 90,
            camera.position.y + 40 + Math.random() * 25,
            camera.position.z - 45 - Math.random() * 60
          );
          star.dir.set(-1.2 - Math.random() * 0.8, -0.6 - Math.random() * 0.4, 0.3).normalize();
          star.speed = 0.025 + Math.random() * 0.02;
          star.tail.visible = true;
          star.head.visible = true;
        }

        if (star.active) {
          star.progress += star.speed;
          const currentHead = star.start.clone().add(star.dir.clone().multiplyScalar(star.progress * 50));
          const currentTail = star.start.clone().add(star.dir.clone().multiplyScalar(Math.max(0, star.progress * 50 - 9)));

          star.head.position.copy(currentHead);

          const positions = star.tail.geometry.attributes.position.array as Float32Array;
          positions[0] = currentTail.x;
          positions[1] = currentTail.y;
          positions[2] = currentTail.z;
          positions[3] = currentHead.x;
          positions[4] = currentHead.y;
          positions[5] = currentHead.z;
          star.tail.geometry.attributes.position.needsUpdate = true;

          if (star.progress >= 1) {
            star.active = false;
            star.tail.visible = false;
            star.head.visible = false;
          }
        }
      });

      // --- PHYSICAL LANDMARKS ANIMATION ---
      cp1Ring.rotation.z += 0.02;
      crystalMesh.rotation.y += 0.032;
      crystalMesh.rotation.x = Math.sin(t * 1.5) * 0.2;
      campfireLight.intensity = 5.0 + Math.sin(t * 15.0) * 1.5;

      // Checkpoint arrival trigger detection
      const checkpointRanges = [
        { id: 1, p: 0.25 },
        { id: 2, p: 0.55 },
        { id: 3, p: 0.80 },
        { id: 4, p: 1.00 },
      ];

      checkpointRanges.forEach(({ id, p: targetP }) => {
        if (Math.abs(p - targetP) < 0.045 && state.lastArrivedCheckpoint !== id) {
          state.lastArrivedCheckpoint = id;
          audioEngine.playCheckpointArrive();
          if (onCheckpointTrigger) {
            onCheckpointTrigger(id);
          }
        }
      });

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);

    // --- 10. RESIZE HANDLER ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- 11. CLEANUP ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onCheckpointTrigger]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#01030a]"
    />
  );
};
