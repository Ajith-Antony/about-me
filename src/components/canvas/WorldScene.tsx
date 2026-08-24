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
    footsteps: [] as { x: number; y: number; z: number; rotY: number; age: number; mesh: THREE.Mesh }[],
    snowDustParticles: [] as { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; size: number }[],
    shootingStars: [] as {
      start: THREE.Vector3;
      dir: THREE.Vector3;
      progress: number;
      speed: number;
      active: boolean;
      tail: THREE.Line;
      head: THREE.Mesh;
    }[],
  });

  // Keep target progress in sync
  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. SCENE, CAMERA & RENDERER SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040816, 0.024);

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
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. TRAIL SPLINE PATH (Realistic S-Curved Arctic Mountain Ascent) ---
    // Smooth 3D spline winding from bottom-right (start) up into the icy peaks
    const splinePoints = [
      new THREE.Vector3(2.2, 0.0, 8.5),     // Scene 0: Trail Entrance (Hero)
      new THREE.Vector3(1.7, 0.4, 3.5),
      new THREE.Vector3(1.2, 1.1, -2.5),    // Checkpoint 1: Skills Signpost (25%)
      new THREE.Vector3(0.4, 2.2, -9.5),
      new THREE.Vector3(-0.5, 3.5, -17.5),  // Checkpoint 2: Experience Campsite (55%)
      new THREE.Vector3(0.1, 4.9, -25.5),
      new THREE.Vector3(0.9, 6.4, -33.5),   // Checkpoint 3: Ancient Observatory (80%)
      new THREE.Vector3(0.3, 7.9, -41.5),
      new THREE.Vector3(0.0, 9.2, -49.0),   // Checkpoint 4: Summit Beacon (100%)
    ];
    const trailCurve = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal', 0.5);

    // --- 3. LIGHTING SYSTEM (Atmospheric Moonlight + Bioluminescent Lanterns) ---
    const ambientLight = new THREE.AmbientLight(0x0c1b33, 1.3);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x224870, 0x060c18, 1.1);
    scene.add(hemisphereLight);

    // Stark directional moonlight with sharp realistic shadow mapping
    const moonLight = new THREE.DirectionalLight(0xdbeafe, 2.8);
    moonLight.position.set(-28, 48, -35);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 140;
    moonLight.shadow.camera.left = -35;
    moonLight.shadow.camera.right = 35;
    moonLight.shadow.camera.top = 35;
    moonLight.shadow.camera.bottom = -35;
    moonLight.shadow.bias = -0.0004;
    scene.add(moonLight);

    // --- 4. CELESTIAL SKY DYNAMICS ---
    // 4A. Hyper-Realistic Moon with Crater Normal Mapping & Atmospheric Halos
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-28, 42, -90);

    // Moon sphere
    const moonGeo = new THREE.SphereGeometry(5.2, 48, 48);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.1,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.45,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);

    // Multi-Layered Volumetric Lunar Halo Rings
    const haloGeo1 = new THREE.PlaneGeometry(32, 32);
    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo1 = new THREE.Mesh(haloGeo1, haloMat1);
    moonHalo1.position.z += 0.2;
    moonGroup.add(moonHalo1);

    const haloGeo2 = new THREE.PlaneGeometry(55, 55);
    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo2 = new THREE.Mesh(haloGeo2, haloMat2);
    moonHalo2.position.z += 0.1;
    moonGroup.add(moonHalo2);

    scene.add(moonGroup);

    // 4B. Volumetric GLSL Aurora Borealis Curtains (Multi-Octave Organic Ribbons)
    const auroraGeo = new THREE.CylinderGeometry(125, 125, 42, 80, 32, true);
    const auroraUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x05ffa1) }, // Luminous Arctic Emerald
      uColor2: { value: new THREE.Color(0x00e5ff) }, // Glacial Cyan
      uColor3: { value: new THREE.Color(0xa855f7) }, // Deep Astral Violet
      uColor4: { value: new THREE.Color(0xec4899) }, // Polar Rose Fringe
    };

    const auroraMat = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vElevation;
        uniform float uTime;

        void main() {
          vUv = uv;
          vPos = position;
          vec3 pos = position;

          // Organic harmonic wave physics
          float wave1 = sin(pos.x * 0.035 + uTime * 0.65) * 5.2;
          float wave2 = cos(pos.z * 0.045 + uTime * 0.45) * 4.4;
          float wave3 = sin(pos.x * 0.08 + pos.z * 0.06 + uTime * 0.85) * 2.8;
          
          pos.y += wave1 + wave2 + wave3;
          vElevation = wave1 + wave2 + wave3;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vElevation;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;

        void main() {
          // Vertical soft fade (top and bottom feathering)
          float vFade = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.62, vUv.y);

          // Raymarched ripple filaments
          float curtain1 = sin(vPos.x * 0.09 + uTime * 0.9 + sin(vPos.z * 0.05 + uTime * 0.4) * 3.5);
          curtain1 = smoothstep(-0.25, 0.85, curtain1);

          float curtain2 = cos(vPos.z * 0.12 - uTime * 0.75 + sin(vPos.x * 0.07 + uTime * 0.5) * 2.2);
          curtain2 = smoothstep(-0.1, 0.9, curtain2);

          float curtainCombined = (curtain1 * 0.65 + curtain2 * 0.35);

          // Dynamic multi-color gradient mixing
          vec3 col = mix(uColor1, uColor2, sin(vUv.x * 6.28 + uTime * 0.3) * 0.5 + 0.5);
          col = mix(col, uColor3, cos(vPos.z * 0.04 + uTime * 0.4) * 0.5 + 0.5);
          col = mix(col, uColor4, clamp(vElevation * 0.15, 0.0, 1.0) * 0.4);

          float alpha = vFade * curtainCombined * 0.62;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.position.set(0, 36, -35);
    scene.add(auroraMesh);

    // 4C. High-Density Starfield & Astronomical Nebulae
    const starCount = 3200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 150 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15); // Upper celestial hemisphere

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) + 12;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Color temperature classification
      const temp = Math.random();
      if (temp > 0.85) {
        starColors[i * 3] = 0.65; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Class O/B Blue-White
        starSizes[i] = 1.8;
      } else if (temp > 0.65) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 0.75; // Class G/K Amber-Gold
        starSizes[i] = 1.4;
      } else if (temp > 0.5) {
        starColors[i * 3] = 0.85; starColors[i * 3 + 1] = 0.7; starColors[i * 3 + 2] = 1.0; // Polar Violet
        starSizes[i] = 1.2;
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0; // Pure Brilliant White
        starSizes[i] = 1.0;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4D. Shooting Stars Engine
    const shootingStarMat = new THREE.LineBasicMaterial({
      color: 0xe0f2fe,
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

        const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        head.visible = false;
        scene.add(head);

        stars.push({
          start: new THREE.Vector3(),
          dir: new THREE.Vector3(),
          progress: 1,
          speed: 0.02,
          active: false,
          tail: line,
          head: head,
        });
      }
      stateRef.current.shootingStars = stars;
    };
    initShootingStars();

    // --- 5. REALISTIC GLACIATED MOUNTAINS & PROCEDURAL SNOW TERRAIN ---
    // 5A. Procedural Glaciated Mountain Backdrop Meshes with Snowy Crevasses
    const createMountainPeak = (
      x: number,
      y: number,
      z: number,
      scaleX: number,
      scaleY: number,
      scaleZ: number,
      isApex = false
    ) => {
      const geo = new THREE.ConeGeometry(scaleX, scaleY, 9, 4);
      
      // Deform peak geometry for natural razor-sharp jagged crags
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vy = pos.getY(i);
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        if (vy < scaleY * 0.45) {
          const noise = Math.sin(vx * 0.4) * Math.cos(vz * 0.4) * (scaleX * 0.15);
          pos.setX(i, vx + noise);
          pos.setZ(i, vz + noise);
        }
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: isApex ? 0x162947 : 0x0f1d33,
        roughness: 0.8,
        metalness: 0.2,
        flatShading: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + scaleY / 2, z);
      mesh.scale.set(1, 1, scaleZ / scaleX);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // Imposing glaciated mountain range
    createMountainPeak(0, 12, -78, 48, 70, 38, true);      // Central Arctic Apex (Summit)
    createMountainPeak(-44, 6, -68, 38, 52, 30);          // Left Mountain Ridge
    createMountainPeak(42, 7, -72, 40, 56, 32);           // Right Mountain Ridge
    createMountainPeak(-24, 4, -54, 26, 36, 22);          // Mid-Left Crag
    createMountainPeak(26, 5, -56, 28, 40, 24);           // Mid-Right Crag
    createMountainPeak(-65, 3, -85, 45, 48, 35);          // Far Left Horizon
    createMountainPeak(65, 4, -88, 50, 52, 38);           // Far Right Horizon

    // 5B. Mountain Terrain with Slope & Trail Valley
    const terrainGeo = new THREE.PlaneGeometry(85, 105, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainPos = terrainGeo.attributes.position;
    for (let i = 0; i < terrainPos.count; i++) {
      const px = terrainPos.getX(i);
      const pz = terrainPos.getZ(i);

      // Natural mountain slope rising towards summit
      const slope = (-pz + 35) * 0.135;
      const hills = Math.sin(px * 0.16) * Math.cos(pz * 0.12) * 1.9 + Math.sin(px * 0.32 + pz * 0.18) * 0.9;
      
      // Carve natural canyon valley for the walking trail
      const pathDist = Math.abs(px - (Math.sin(pz * 0.075) * 2.2));
      const valleyFactor = Math.min(1.0, pathDist * 0.32);

      terrainPos.setY(i, (slope + hills) * valleyFactor);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x11213b, // Deep icy granite & compact snow
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, 0, -22);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 5C. Winding Snow Trail Path Ribbon with Frost Specular
    const trailRibbonGeo = new THREE.BufferGeometry();
    const trailSegments = 90;
    const trailWidth = 1.5;
    const trailPositions = new Float32Array(trailSegments * 2 * 3);

    for (let i = 0; i < trailSegments; i++) {
      const u = i / (trailSegments - 1);
      const pt = trailCurve.getPoint(u);
      const tangent = trailCurve.getTangent(u);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(trailWidth * 0.5));
      const right = pt.clone().add(normal.clone().multiplyScalar(-trailWidth * 0.5));

      trailPositions[i * 6] = left.x;
      trailPositions[i * 6 + 1] = left.y + 0.025;
      trailPositions[i * 6 + 2] = left.z;

      trailPositions[i * 6 + 3] = right.x;
      trailPositions[i * 6 + 4] = right.y + 0.025;
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
      color: 0x1f385c, // Beaten icy snow track
      roughness: 0.6,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });
    const trailRibbon = new THREE.Mesh(trailRibbonGeo, trailMat);
    trailRibbon.receiveShadow = true;
    scene.add(trailRibbon);

    // 5D. Blizzard Snow Dust & Swirling Crystals
    const blizzardCount = 1800;
    const blizzardGeo = new THREE.BufferGeometry();
    const blizzardPositions = new Float32Array(blizzardCount * 3);
    const blizzardVelocities = new Float32Array(blizzardCount * 3);

    for (let i = 0; i < blizzardCount; i++) {
      blizzardPositions[i * 3] = (Math.random() - 0.5) * 65;
      blizzardPositions[i * 3 + 1] = Math.random() * 28;
      blizzardPositions[i * 3 + 2] = (Math.random() - 0.5) * 85 - 18;

      blizzardVelocities[i * 3] = -0.07 - Math.random() * 0.09;     // Leftward wind drift
      blizzardVelocities[i * 3 + 1] = -0.035 - Math.random() * 0.045; // Falling snow
      blizzardVelocities[i * 3 + 2] = -0.025 - Math.random() * 0.045;
    }
    blizzardGeo.setAttribute('position', new THREE.BufferAttribute(blizzardPositions, 3));

    const blizzardMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.38,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const blizzardPoints = new THREE.Points(blizzardGeo, blizzardMat);
    scene.add(blizzardPoints);

    // --- 6. CHECKPOINT 3D PROPS & BIOLUMINESCENT BEACONS ---
    // Checkpoint 1 (25% progress): The Signpost of Mastery
    const cp1Group = new THREE.Group();
    const cp1Pos = trailCurve.getPoint(0.25);
    cp1Group.position.copy(cp1Pos).add(new THREE.Vector3(-1.5, 0, -0.3));

    // Wooden carved beacon post
    const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.4, 8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
    const postMesh = new THREE.Mesh(postGeo, woodMat);
    postMesh.position.y = 1.2;
    postMesh.castShadow = true;
    cp1Group.add(postMesh);

    // Signboard
    const signGeo = new THREE.BoxGeometry(1.3, 0.36, 0.08);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x54321d, roughness: 0.85 });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0.35, 1.9, 0);
    signMesh.rotation.z = -0.04;
    signMesh.castShadow = true;
    cp1Group.add(signMesh);

    // Glowing Lantern on Post
    const cp1LanternGeo = new THREE.OctahedronGeometry(0.16, 0);
    const cp1LanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cp1Lantern = new THREE.Mesh(cp1LanternGeo, cp1LanternMat);
    cp1Lantern.position.set(0.45, 1.55, 0.18);
    cp1Group.add(cp1Lantern);

    const cp1Light = new THREE.PointLight(0x38bdf8, 3.8, 8);
    cp1Light.position.copy(cp1Lantern.position);
    cp1Group.add(cp1Light);

    // Holographic Pulsing Ring Marker
    const ringGeo = new THREE.RingGeometry(0.45, 0.58, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const cp1Ring = new THREE.Mesh(ringGeo, ringMat);
    cp1Ring.position.set(0, 2.7, 0);
    cp1Ring.rotation.x = Math.PI / 2;
    cp1Group.add(cp1Ring);
    scene.add(cp1Group);

    // Checkpoint 2 (55% progress): The Expedition Campsite
    const cp2Group = new THREE.Group();
    const cp2Pos = trailCurve.getPoint(0.55);
    cp2Group.position.copy(cp2Pos).add(new THREE.Vector3(-2.3, 0, -0.6));

    // Wooden A-Frame Mountain Shelter
    const tentGeo = new THREE.ConeGeometry(1.9, 2.6, 4, 1);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.92 });
    const tentMesh = new THREE.Mesh(tentGeo, tentMat);
    tentMesh.position.y = 1.3;
    tentMesh.rotation.y = Math.PI / 4;
    tentMesh.castShadow = true;
    cp2Group.add(tentMesh);

    // Campfire with flickering amber light & glowing embers
    const fireGeo = new THREE.DodecahedronGeometry(0.28, 0);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7b00 });
    const fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.position.set(1.5, 0.22, 0.9);
    cp2Group.add(fireMesh);

    const campfireLight = new THREE.PointLight(0xff8c00, 5.5, 12);
    campfireLight.position.copy(fireMesh.position);
    campfireLight.position.y += 0.35;
    cp2Group.add(campfireLight);
    scene.add(cp2Group);

    // Checkpoint 3 (80% progress): The Ancient Observatory Arch
    const cp3Group = new THREE.Group();
    const cp3Pos = trailCurve.getPoint(0.8);
    cp3Group.position.copy(cp3Pos).add(new THREE.Vector3(1.9, 0, -0.5));

    // Megalithic Stone Arch
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, flatShading: true });
    const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.5), stoneMat);
    pillar1.position.set(-1.0, 1.7, 0);
    pillar1.castShadow = true;
    cp3Group.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.5), stoneMat);
    pillar2.position.set(1.0, 1.7, 0);
    pillar2.castShadow = true;
    cp3Group.add(pillar2);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.5, 0.6), stoneMat);
    lintel.position.set(0, 3.5, 0);
    lintel.castShadow = true;
    cp3Group.add(lintel);

    // Floating Celestial Crystal Lens
    const crystalGeo = new THREE.OctahedronGeometry(0.38, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.set(0, 2.3, 0);
    cp3Group.add(crystalMesh);

    const crystalLight = new THREE.PointLight(0xc084fc, 4.5, 9);
    crystalLight.position.copy(crystalMesh.position);
    cp3Group.add(crystalLight);
    scene.add(cp3Group);

    // Checkpoint 4 (100% progress): Summit Beacon Apex Cairn
    const cp4Group = new THREE.Group();
    const cp4Pos = trailCurve.getPoint(1.0);
    cp4Group.position.copy(cp4Pos).add(new THREE.Vector3(0, 0, -1.3));

    // Summit Stone Cairn
    const cairnGeo = new THREE.ConeGeometry(1.0, 1.8, 6);
    const cairnMesh = new THREE.Mesh(cairnGeo, stoneMat);
    cairnMesh.position.y = 0.9;
    cairnMesh.castShadow = true;
    cp4Group.add(cairnMesh);

    // Glowing Golden Apex Beacon
    const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 2.2, 0);
    cp4Group.add(beaconMesh);

    const summitLight = new THREE.PointLight(0xfef08a, 6.5, 16);
    summitLight.position.copy(beaconMesh.position);
    cp4Group.add(summitLight);
    scene.add(cp4Group);

    // --- 7. DETAILED 3D ADVENTURER CHARACTER RIG ---
    // (Strictly positioned on the RIGHT side, facing away towards the mountain in third-person view)
    const characterGroup = new THREE.Group();
    characterGroup.castShadow = true;

    // Materials
    const parkaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.1 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // 7A. Torso (Heavy Parka)
    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.76, 10);
    const torsoMesh = new THREE.Mesh(torsoGeo, parkaMat);
    torsoMesh.position.y = 1.08;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    // Arctic fur collar
    const furGeo = new THREE.TorusGeometry(0.26, 0.09, 8, 16);
    const furMesh = new THREE.Mesh(furGeo, furMat);
    furMesh.position.set(0, 1.46, 0);
    furMesh.rotation.x = Math.PI / 2;
    characterGroup.add(furMesh);

    // 7B. Hood & Head
    const hoodGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const hoodMesh = new THREE.Mesh(hoodGeo, parkaMat);
    hoodMesh.position.set(0, 1.62, 0);
    hoodMesh.castShadow = true;
    characterGroup.add(hoodMesh);

    // Snow goggles strap on back of hood
    const goggleStrapGeo = new THREE.TorusGeometry(0.23, 0.02, 6, 14);
    const goggleStrap = new THREE.Mesh(goggleStrapGeo, leatherMat);
    goggleStrap.position.copy(hoodMesh.position);
    goggleStrap.rotation.x = Math.PI / 2.2;
    characterGroup.add(goggleStrap);

    // 7C. Expedition Backpack with Hanging Lantern & Gear
    const packGeo = new THREE.BoxGeometry(0.38, 0.56, 0.26);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const packMesh = new THREE.Mesh(packGeo, packMat);
    packMesh.position.set(0, 1.15, -0.24); // On character's back (facing camera in third-person view)
    packMesh.castShadow = true;
    characterGroup.add(packMesh);

    // Bedroll on top of backpack
    const rollGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.46, 12);
    const rollMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.9 });
    const rollMesh = new THREE.Mesh(rollGeo, rollMat);
    rollMesh.position.set(0, 1.48, -0.24);
    rollMesh.rotation.z = Math.PI / 2;
    characterGroup.add(rollMesh);

    // Hanging Lantern on backpack
    const charLanternGeo = new THREE.DodecahedronGeometry(0.09, 0);
    const charLanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const charLantern = new THREE.Mesh(charLanternGeo, charLanternMat);
    charLantern.position.set(0.2, 0.88, -0.34);
    characterGroup.add(charLantern);

    const charLanternLight = new THREE.PointLight(0x38bdf8, 2.5, 5.0);
    charLanternLight.position.copy(charLantern.position);
    characterGroup.add(charLanternLight);

    // 7D. Articulated Legs & Heavy Crampon Boots
    const legGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.68, 8);
    const bootGeo = new THREE.BoxGeometry(0.16, 0.2, 0.28);

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.15, 0.74, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, parkaMat);
    leftLegMesh.position.y = -0.32;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    const leftBoot = new THREE.Mesh(bootGeo, leatherMat);
    leftBoot.position.set(0, -0.65, 0.05);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);
    characterGroup.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.15, 0.74, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, parkaMat);
    rightLegMesh.position.y = -0.32;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    const rightBoot = new THREE.Mesh(bootGeo, leatherMat);
    rightBoot.position.set(0, -0.65, 0.05);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);
    characterGroup.add(rightLeg);

    // 7E. Articulated Arms & Trekking Pole
    const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.64, 8);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.34, 1.38, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, parkaMat);
    leftArmMesh.position.y = -0.29;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), gloveMat);
    leftGlove.position.set(0, -0.6, 0);
    leftArm.add(leftGlove);
    characterGroup.add(leftArm);

    // Right Arm with Trekking Pole
    const rightArm = new THREE.Group();
    rightArm.position.set(0.34, 1.38, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, parkaMat);
    rightArmMesh.position.y = -0.29;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), gloveMat);
    rightGlove.position.set(0, -0.6, 0);
    rightArm.add(rightGlove);

    // Carbon-fiber Trekking Pole
    const staffGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.45, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
    const staffMesh = new THREE.Mesh(staffGeo, staffMat);
    staffMesh.position.set(0.08, -0.28, 0.2);
    staffMesh.rotation.x = -0.22;
    rightArm.add(staffMesh);

    characterGroup.add(rightArm);
    scene.add(characterGroup);

    // Initial position on trail
    const startPoint = trailCurve.getPoint(0);
    characterGroup.position.copy(startPoint);
    characterGroup.lookAt(trailCurve.getPoint(0.02));

    // --- 8. FOOTSTEP DECAL SPANWNER ---
    const footprintGeo = new THREE.PlaneGeometry(0.14, 0.26);
    footprintGeo.rotateX(-Math.PI / 2);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x0d1726,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const spawnFootstep = (pos: THREE.Vector3, rotY: number) => {
      const mesh = new THREE.Mesh(footprintGeo, footprintMat);
      mesh.position.copy(pos);
      mesh.position.y += 0.03;
      mesh.rotation.y = rotY;
      scene.add(mesh);
      stateRef.current.footsteps.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotY,
        age: 0,
        mesh,
      });

      // Keep maximum 40 footprints in memory
      if (stateRef.current.footsteps.length > 40) {
        const oldest = stateRef.current.footsteps.shift();
        if (oldest) {
          scene.remove(oldest.mesh);
          oldest.mesh.geometry.dispose();
        }
      }
    };

    // --- 9. ANIMATION & RENDER LOOP ---
    let animFrameId: number;
    let lastStepTime = 0;

    const animate = () => {
      const state = stateRef.current;
      state.time += 0.016;
      const t = state.time;

      // Update GLSL Aurora time uniform
      auroraUniforms.uTime.value = t;

      // Smooth scroll lerp (damping for physical momentum)
      const delta = state.targetProgress - state.scrollProgress;
      state.scrollProgress += delta * 0.085;
      state.velocity = (state.scrollProgress - state.lastProgress) * 60;
      state.lastProgress = state.scrollProgress;

      const p = Math.max(0, Math.min(1, state.scrollProgress));
      const speed = Math.abs(state.velocity);
      const isMoving = speed > 0.012;

      // Update Character Position along 3D CatmullRom Curve
      const currentPoint = trailCurve.getPoint(p);
      const lookAheadP = Math.min(1.0, p + 0.018);
      const targetLook = trailCurve.getPoint(lookAheadP);

      characterGroup.position.copy(currentPoint);
      characterGroup.lookAt(targetLook.x, currentPoint.y, targetLook.z);

      // --- FIFA-STYLE IDLE & LOCOMOTION BLENDING ---
      if (isMoving) {
        // WALKING LOCOMOTION
        state.walkPhase += speed * 4.2 + 0.065;
        const phase = state.walkPhase;

        // Leg stride
        leftLeg.rotation.x = Math.sin(phase) * 0.7;
        rightLeg.rotation.x = -Math.sin(phase) * 0.7;

        // Arm counter-swing
        leftArm.rotation.x = -Math.sin(phase) * 0.6;
        rightArm.rotation.x = Math.sin(phase) * 0.5;

        // Vertical spine bounce & forward tilt on ascent
        torsoMesh.position.y = 1.08 + Math.abs(Math.sin(phase)) * 0.06;
        hoodMesh.position.y = 1.62 + Math.abs(Math.sin(phase)) * 0.06;
        packMesh.position.y = 1.15 + Math.abs(Math.sin(phase)) * 0.07;
        characterGroup.rotation.x = 0.08; // Slight forward mountain lean

        // Spine sway
        characterGroup.rotation.z = Math.sin(phase) * 0.035;

        // Backpack lantern swing with momentum
        charLantern.position.x = 0.2 + Math.sin(phase * 1.5) * 0.05;

        // Footstep audio and footprint placement on footstrike
        if (Math.abs(Math.sin(phase)) > 0.94 && t - lastStepTime > 0.26) {
          lastStepTime = t;
          audioEngine.playFootstep();
          const isLeft = Math.sin(phase) > 0;
          const stepOffset = new THREE.Vector3(isLeft ? -0.16 : 0.16, 0, 0);
          stepOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterGroup.rotation.y);
          spawnFootstep(currentPoint.clone().add(stepOffset), characterGroup.rotation.y);
        }
      } else {
        // FIFA-STYLE AAA LIFELIKE IDLE STANCE
        // 1. Subtle rhythmic chest expansion (breathing)
        const breath = Math.sin(t * 2.2) * 0.025;
        torsoMesh.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath);

        // 2. Procedural hip weight shifting (alternating leg rest every 4s)
        const weightShift = Math.sin(t * 0.75) * 0.045;
        leftLeg.rotation.z = weightShift * 0.6;
        rightLeg.rotation.z = -weightShift * 0.6;
        leftLeg.rotation.x = 0.06;
        rightLeg.rotation.x = -0.06;

        // 3. Head looking around at the aurora / distant summit
        hoodMesh.rotation.y = Math.sin(t * 0.4) * 0.22;
        hoodMesh.rotation.x = -0.06 + Math.cos(t * 0.45) * 0.09;

        // 4. Subtle arm & shoulder relaxing
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.06, 0.1);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.08, 0.1);
        characterGroup.rotation.z = THREE.MathUtils.lerp(characterGroup.rotation.z, 0, 0.1);
        characterGroup.rotation.x = THREE.MathUtils.lerp(characterGroup.rotation.x, 0.02, 0.1);

        // 5. Hanging lantern gentle wind swing
        charLantern.position.x = 0.2 + Math.sin(t * 2.6) * 0.025;
      }

      // --- THIRD-PERSON CAMERA RIG ---
      // Positioned behind character, framed on the RIGHT side of the screen
      const isMobile = window.innerWidth < 768;
      const camSideOffset = isMobile ? 0.2 : -1.35; // Shifts camera left so character is on the right
      const camHeight = isMobile ? 1.7 : 1.9;
      const camDistance = isMobile ? 4.0 : 4.6;

      const camTangent = trailCurve.getTangent(p);
      const camNormal = new THREE.Vector3(-camTangent.z, 0, camTangent.x).normalize();

      const targetCamPos = currentPoint.clone()
        .sub(camTangent.clone().multiplyScalar(camDistance))
        .add(camNormal.clone().multiplyScalar(camSideOffset));
      targetCamPos.y += camHeight;

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos, 0.085);

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
        if (blizzardPos[i * 3 + 1] < camera.position.y - 6) {
          blizzardPos[i * 3 + 1] = camera.position.y + 20;
          blizzardPos[i * 3] = camera.position.x + (Math.random() - 0.5) * 55;
          blizzardPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 55;
        }
      }
      blizzardGeo.attributes.position.needsUpdate = true;

      // --- SHOOTING STARS ENGINE ANIMATION ---
      state.shootingStars.forEach((star) => {
        if (!star.active && Math.random() < 0.003) {
          star.active = true;
          star.progress = 0;
          star.start.set(
            camera.position.x + (Math.random() - 0.5) * 80,
            camera.position.y + 35 + Math.random() * 25,
            camera.position.z - 40 - Math.random() * 50
          );
          star.dir.set(-1.2 - Math.random() * 0.8, -0.6 - Math.random() * 0.4, 0.3).normalize();
          star.speed = 0.025 + Math.random() * 0.02;
          star.tail.visible = true;
          star.head.visible = true;
        }

        if (star.active) {
          star.progress += star.speed;
          const currentHead = star.start.clone().add(star.dir.clone().multiplyScalar(star.progress * 45));
          const currentTail = star.start.clone().add(star.dir.clone().multiplyScalar(Math.max(0, star.progress * 45 - 8)));

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

      // --- CHECKPOINT PROPS ANIMATION ---
      cp1Ring.rotation.z += 0.022;
      crystalMesh.rotation.y += 0.035;
      crystalMesh.rotation.x = Math.sin(t * 1.6) * 0.22;
      campfireLight.intensity = 4.5 + Math.sin(t * 14.0) * 1.4; // Campfire flame flicker

      // Checkpoint trigger detection
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
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
};
