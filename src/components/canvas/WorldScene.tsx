import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';
import {
  generateSnowTextures,
  generateRockNormalMap,
  generateMoonTexture,
  generateParkaTexture,
} from '../../utils/ProceduralTextures';

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
    breathTimer: 0,
    footsteps: [] as { mesh: THREE.Mesh; age: number }[],
    breathPuffs: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[],
    sparkEmbers: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
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

  // Sync scroll progress
  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. THREE.JS ENGINE SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.022);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1400
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

    // --- 2. GENERATE PROCEDURAL HIGH-RESOLUTION PBR TEXTURES ---
    const { normalMap: snowNormal, roughnessMap: snowRoughness } = generateSnowTextures();
    const rockNormal = generateRockNormalMap();
    const moonAlbedo = generateMoonTexture();
    const parkaTexture = generateParkaTexture();

    // --- 3. TRAIL SPLINE PATH (Realistic S-Curved Mountain Ascent) ---
    const splinePoints = [
      new THREE.Vector3(2.4, 0.0, 9.0),     // Scene 0: Trail Entrance (Hero)
      new THREE.Vector3(1.8, 0.45, 3.8),
      new THREE.Vector3(1.3, 1.15, -2.8),   // Checkpoint 1: Skills Signpost (25%)
      new THREE.Vector3(0.4, 2.3, -10.2),
      new THREE.Vector3(-0.6, 3.6, -18.2),  // Checkpoint 2: Experience Campsite (55%)
      new THREE.Vector3(0.1, 5.1, -26.5),
      new THREE.Vector3(1.0, 6.6, -34.8),   // Checkpoint 3: Ancient Observatory (80%)
      new THREE.Vector3(0.4, 8.1, -42.8),
      new THREE.Vector3(0.0, 9.4, -50.5),   // Checkpoint 4: Summit Beacon (100%)
    ];
    const trailCurve = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal', 0.5);

    // --- 4. LIGHTING & VOLUMETRICS ---
    const ambientLight = new THREE.AmbientLight(0x0c1b33, 1.35);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x244c78, 0x050a14, 1.2);
    scene.add(hemisphereLight);

    // Stark directional moonlight with sharp realistic shadows
    const moonLight = new THREE.DirectionalLight(0xdbeafe, 3.0);
    moonLight.position.set(-32, 52, -40);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 150;
    moonLight.shadow.camera.left = -40;
    moonLight.shadow.camera.right = 40;
    moonLight.shadow.camera.top = 40;
    moonLight.shadow.camera.bottom = -40;
    moonLight.shadow.bias = -0.0003;
    scene.add(moonLight);

    // --- 5. CELESTIAL SKYBOX & VOLUMETRIC AURORA BOREALIS ---
    // 5A. Photorealistic Moon with Crater Surface & Multi-Layer Halos
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-32, 46, -100);

    const moonGeo = new THREE.SphereGeometry(5.8, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonAlbedo,
      roughness: 0.82,
      metalness: 0.08,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.55,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.rotation.y = Math.PI * 0.2;
    moonGroup.add(moonMesh);

    // Volumetric Lunar Corona / Halos
    const haloGeo1 = new THREE.PlaneGeometry(38, 38);
    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo1 = new THREE.Mesh(haloGeo1, haloMat1);
    moonHalo1.position.z += 0.2;
    moonGroup.add(moonHalo1);

    const haloGeo2 = new THREE.PlaneGeometry(68, 68);
    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo2 = new THREE.Mesh(haloGeo2, haloMat2);
    moonHalo2.position.z += 0.1;
    moonGroup.add(moonHalo2);
    scene.add(moonGroup);

    // 5B. Multi-Curtain Raymarched Volumetric Aurora Borealis
    const auroraGeo = new THREE.CylinderGeometry(135, 135, 48, 96, 36, true);
    const auroraUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x05ffa1) }, // Luminous Arctic Emerald (557.7nm)
      uColor2: { value: new THREE.Color(0x00e5ff) }, // Glacial Cyan
      uColor3: { value: new THREE.Color(0xa855f7) }, // Deep Astral Violet (391.4nm)
      uColor4: { value: new THREE.Color(0xf43f5e) }, // Polar Rose Top Fringe
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

          // Multi-harmonic magnetic field wave ripples
          float wave1 = sin(pos.x * 0.038 + uTime * 0.72) * 5.8;
          float wave2 = cos(pos.z * 0.048 + uTime * 0.52) * 4.8;
          float wave3 = sin(pos.x * 0.09 + pos.z * 0.07 + uTime * 0.95) * 3.2;

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
          // Vertical soft fade (top and bottom ionization boundary)
          float vFade = smoothstep(0.0, 0.42, vUv.y) * smoothstep(1.0, 0.65, vUv.y);

          // Vertical striated ray filaments
          float ray1 = sin(vPos.x * 0.11 + uTime * 0.95 + sin(vPos.z * 0.06 + uTime * 0.45) * 3.8);
          ray1 = smoothstep(-0.25, 0.88, ray1);

          float ray2 = cos(vPos.z * 0.14 - uTime * 0.8 + sin(vPos.x * 0.08 + uTime * 0.55) * 2.5);
          ray2 = smoothstep(-0.1, 0.92, ray2);

          float curtain = (ray1 * 0.68 + ray2 * 0.32);

          // Dynamic multi-wavelength emission blending
          vec3 col = mix(uColor1, uColor2, sin(vUv.x * 6.28 + uTime * 0.32) * 0.5 + 0.5);
          col = mix(col, uColor3, cos(vPos.z * 0.045 + uTime * 0.42) * 0.5 + 0.5);
          col = mix(col, uColor4, clamp(vElevation * 0.16, 0.0, 1.0) * 0.45);

          float alpha = vFade * curtain * 0.68;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.position.set(0, 38, -38);
    scene.add(auroraMesh);

    // 5C. Deep Celestial Starfield (3,600 Astronomical Stars)
    const starCount = 3600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 160 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.88 + 0.12);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) + 10;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      const temp = Math.random();
      if (temp > 0.82) {
        starColors[i * 3] = 0.65; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Class O/B Blue
      } else if (temp > 0.62) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 0.72; // Class G Gold
      } else if (temp > 0.45) {
        starColors[i * 3] = 0.88; starColors[i * 3 + 1] = 0.75; starColors[i * 3 + 2] = 1.0; // Violet
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;   // Brilliant White
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5D. Autonomous Shooting Stars Engine
    const shootingStarMat = new THREE.LineBasicMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    const initShootingStars = () => {
      const stars = [];
      for (let i = 0; i < 4; i++) {
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
          speed: 0.022,
          active: false,
          tail: line,
          head: head,
        });
      }
      stateRef.current.shootingStars = stars;
    };
    initShootingStars();

    // --- 6. GLACIATED MOUNTAIN HORIZON & PBR SNOW TERRAIN ---
    // 6A. Majestic Mountain Peaks with Rock Strata & Snow Accumulation
    const createMountainPeak = (
      x: number,
      y: number,
      z: number,
      scaleX: number,
      scaleY: number,
      scaleZ: number,
      isApex = false
    ) => {
      const geo = new THREE.ConeGeometry(scaleX, scaleY, 12, 6);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vy = pos.getY(i);
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        if (vy < scaleY * 0.48) {
          const noise = Math.sin(vx * 0.35) * Math.cos(vz * 0.35) * (scaleX * 0.18);
          pos.setX(i, vx + noise);
          pos.setZ(i, vz + noise);
        }
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: isApex ? 0x1e3659 : 0x14243b,
        roughness: 0.78,
        metalness: 0.22,
        normalMap: rockNormal,
        normalScale: new THREE.Vector2(1.2, 1.2),
        flatShading: false,
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

    createMountainPeak(0, 14, -82, 52, 75, 42, true);     // Central Apex (Summit Zenith)
    createMountainPeak(-48, 7, -72, 42, 56, 32);         // Left Ridge
    createMountainPeak(46, 8, -75, 44, 60, 34);          // Right Ridge
    createMountainPeak(-26, 4, -56, 28, 38, 24);         // Mid-Left Crag
    createMountainPeak(28, 5, -58, 30, 42, 26);          // Mid-Right Crag
    createMountainPeak(-72, 4, -92, 50, 52, 38);         // Far Horizon Left
    createMountainPeak(72, 5, -95, 54, 56, 40);          // Far Horizon Right

    // 6B. Procedural Snow Mountain Ground with PBR Snow Normal & Roughness
    const terrainGeo = new THREE.PlaneGeometry(95, 115, 72, 72);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainPos = terrainGeo.attributes.position;
    for (let i = 0; i < terrainPos.count; i++) {
      const px = terrainPos.getX(i);
      const pz = terrainPos.getZ(i);

      // Natural rising slope
      const slope = (-pz + 38) * 0.138;
      const hills = Math.sin(px * 0.15) * Math.cos(pz * 0.11) * 2.1 + Math.sin(px * 0.3 + pz * 0.16) * 1.0;
      
      // Carve central trail valley
      const pathDist = Math.abs(px - (Math.sin(pz * 0.072) * 2.3));
      const valleyFactor = Math.min(1.0, pathDist * 0.3);

      terrainPos.setY(i, (slope + hills) * valleyFactor);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x142847,
      roughness: 0.72,
      metalness: 0.18,
      normalMap: snowNormal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: snowRoughness,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, 0, -24);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 6C. Winding Icy Snow Trail Ribbon
    const trailRibbonGeo = new THREE.BufferGeometry();
    const trailSegments = 96;
    const trailWidth = 1.6;
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
      color: 0x22426c,
      roughness: 0.55,
      metalness: 0.28,
      normalMap: snowNormal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      side: THREE.DoubleSide,
    });
    const trailRibbon = new THREE.Mesh(trailRibbonGeo, trailMat);
    trailRibbon.receiveShadow = true;
    scene.add(trailRibbon);

    // 6D. Swirling Blizzard Particle System (2,000 Ice Crystals)
    const blizzardCount = 2000;
    const blizzardGeo = new THREE.BufferGeometry();
    const blizzardPositions = new Float32Array(blizzardCount * 3);
    const blizzardVelocities = new Float32Array(blizzardCount * 3);

    for (let i = 0; i < blizzardCount; i++) {
      blizzardPositions[i * 3] = (Math.random() - 0.5) * 70;
      blizzardPositions[i * 3 + 1] = Math.random() * 30;
      blizzardPositions[i * 3 + 2] = (Math.random() - 0.5) * 90 - 20;

      blizzardVelocities[i * 3] = -0.075 - Math.random() * 0.095;
      blizzardVelocities[i * 3 + 1] = -0.04 - Math.random() * 0.05;
      blizzardVelocities[i * 3 + 2] = -0.03 - Math.random() * 0.05;
    }
    blizzardGeo.setAttribute('position', new THREE.BufferAttribute(blizzardPositions, 3));

    const blizzardMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.4,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const blizzardPoints = new THREE.Points(blizzardGeo, blizzardMat);
    scene.add(blizzardPoints);

    // --- 7. CHECKPOINT 3D PROPS & BIOLUMINESCENT BEACONS ---
    // Checkpoint 1 (25% progress): The Signpost of Mastery
    const cp1Group = new THREE.Group();
    const cp1Pos = trailCurve.getPoint(0.25);
    cp1Group.position.copy(cp1Pos).add(new THREE.Vector3(-1.6, 0, -0.3));

    // Carved Nordic Timber Post
    const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.5, 8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.88 });
    const postMesh = new THREE.Mesh(postGeo, woodMat);
    postMesh.position.y = 1.25;
    postMesh.castShadow = true;
    cp1Group.add(postMesh);

    // Signboard
    const signGeo = new THREE.BoxGeometry(1.4, 0.4, 0.08);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x54321d, roughness: 0.82 });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0.4, 2.0, 0);
    signMesh.rotation.z = -0.04;
    signMesh.castShadow = true;
    cp1Group.add(signMesh);

    // Glowing Lantern
    const cp1LanternGeo = new THREE.OctahedronGeometry(0.18, 0);
    const cp1LanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cp1Lantern = new THREE.Mesh(cp1LanternGeo, cp1LanternMat);
    cp1Lantern.position.set(0.5, 1.6, 0.2);
    cp1Group.add(cp1Lantern);

    const cp1Light = new THREE.PointLight(0x38bdf8, 4.0, 9);
    cp1Light.position.copy(cp1Lantern.position);
    cp1Group.add(cp1Light);

    // Holographic Pulsing Ring Marker
    const ringGeo = new THREE.RingGeometry(0.48, 0.62, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    const cp1Ring = new THREE.Mesh(ringGeo, ringMat);
    cp1Ring.position.set(0, 2.8, 0);
    cp1Ring.rotation.x = Math.PI / 2;
    cp1Group.add(cp1Ring);
    scene.add(cp1Group);

    // Checkpoint 2 (55% progress): The Expedition Campsite
    const cp2Group = new THREE.Group();
    const cp2Pos = trailCurve.getPoint(0.55);
    cp2Group.position.copy(cp2Pos).add(new THREE.Vector3(-2.4, 0, -0.6));

    // Wooden A-Frame Mountain Shelter
    const tentGeo = new THREE.ConeGeometry(2.0, 2.8, 4, 1);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const tentMesh = new THREE.Mesh(tentGeo, tentMat);
    tentMesh.position.y = 1.4;
    tentMesh.rotation.y = Math.PI / 4;
    tentMesh.castShadow = true;
    cp2Group.add(tentMesh);

    // Campfire with flickering amber light & glowing embers
    const fireGeo = new THREE.DodecahedronGeometry(0.3, 0);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7b00 });
    const fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.position.set(1.6, 0.24, 1.0);
    cp2Group.add(fireMesh);

    const campfireLight = new THREE.PointLight(0xff8c00, 5.8, 14);
    campfireLight.position.copy(fireMesh.position);
    campfireLight.position.y += 0.4;
    cp2Group.add(campfireLight);
    scene.add(cp2Group);

    // Checkpoint 3 (80% progress): The Ancient Observatory Arch
    const cp3Group = new THREE.Group();
    const cp3Pos = trailCurve.getPoint(0.8);
    cp3Group.position.copy(cp3Pos).add(new THREE.Vector3(2.0, 0, -0.5));

    // Megalithic Stone Arch
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.92,
      normalMap: rockNormal,
      normalScale: new THREE.Vector2(1.0, 1.0),
    });
    const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 0.55), stoneMat);
    pillar1.position.set(-1.1, 1.8, 0);
    pillar1.castShadow = true;
    cp3Group.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 0.55), stoneMat);
    pillar2.position.set(1.1, 1.8, 0);
    pillar2.castShadow = true;
    cp3Group.add(pillar2);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 0.65), stoneMat);
    lintel.position.set(0, 3.7, 0);
    lintel.castShadow = true;
    cp3Group.add(lintel);

    // Floating Celestial Crystal Lens
    const crystalGeo = new THREE.OctahedronGeometry(0.42, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.set(0, 2.4, 0);
    cp3Group.add(crystalMesh);

    const crystalLight = new THREE.PointLight(0xc084fc, 4.8, 10);
    crystalLight.position.copy(crystalMesh.position);
    cp3Group.add(crystalLight);
    scene.add(cp3Group);

    // Checkpoint 4 (100% progress): Summit Beacon Apex Cairn
    const cp4Group = new THREE.Group();
    const cp4Pos = trailCurve.getPoint(1.0);
    cp4Group.position.copy(cp4Pos).add(new THREE.Vector3(0, 0, -1.4));

    // Summit Stone Cairn
    const cairnGeo = new THREE.ConeGeometry(1.1, 2.0, 6);
    const cairnMesh = new THREE.Mesh(cairnGeo, stoneMat);
    cairnMesh.position.y = 1.0;
    cairnMesh.castShadow = true;
    cp4Group.add(cairnMesh);

    // Glowing Golden Apex Beacon
    const beaconGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 2.4, 0);
    cp4Group.add(beaconMesh);

    const summitLight = new THREE.PointLight(0xfef08a, 7.0, 18);
    summitLight.position.copy(beaconMesh.position);
    cp4Group.add(summitLight);
    scene.add(cp4Group);

    // --- 8. HIGH-FIDELITY 3D ADVENTURER CHARACTER RIG ---
    // (Strictly positioned on the RIGHT side, facing away towards the mountain in third-person view)
    const characterGroup = new THREE.Group();
    characterGroup.castShadow = true;

    // Materials
    const parkaMat = new THREE.MeshStandardMaterial({
      map: parkaTexture,
      roughness: 0.72,
      metalness: 0.12,
    });
    const furMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.65 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // 8A. Torso (Baffled Arctic Parka)
    const torsoGeo = new THREE.CylinderGeometry(0.27, 0.31, 0.78, 12);
    const torsoMesh = new THREE.Mesh(torsoGeo, parkaMat);
    torsoMesh.position.y = 1.1;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    // Arctic fur collar
    const furGeo = new THREE.TorusGeometry(0.27, 0.095, 8, 16);
    const furMesh = new THREE.Mesh(furGeo, furMat);
    furMesh.position.set(0, 1.48, 0);
    furMesh.rotation.x = Math.PI / 2;
    characterGroup.add(furMesh);

    // 8B. Hood & Head with Snow Goggles
    const hoodGeo = new THREE.SphereGeometry(0.23, 16, 16);
    const hoodMesh = new THREE.Mesh(hoodGeo, parkaMat);
    hoodMesh.position.set(0, 1.65, 0);
    hoodMesh.castShadow = true;
    characterGroup.add(hoodMesh);

    // Goggles strap on back of hood
    const goggleStrapGeo = new THREE.TorusGeometry(0.24, 0.022, 6, 14);
    const goggleStrap = new THREE.Mesh(goggleStrapGeo, leatherMat);
    goggleStrap.position.copy(hoodMesh.position);
    goggleStrap.rotation.x = Math.PI / 2.2;
    characterGroup.add(goggleStrap);

    // 8C. Expedition Backpack with Hanging Lantern & Gear
    const packGeo = new THREE.BoxGeometry(0.4, 0.58, 0.28);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const packMesh = new THREE.Mesh(packGeo, packMat);
    packMesh.position.set(0, 1.18, -0.26); // On character's back (facing camera in third-person view)
    packMesh.castShadow = true;
    characterGroup.add(packMesh);

    // Bedroll on top of backpack
    const rollGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.48, 12);
    const rollMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.9 });
    const rollMesh = new THREE.Mesh(rollGeo, rollMat);
    rollMesh.position.set(0, 1.52, -0.26);
    rollMesh.rotation.z = Math.PI / 2;
    characterGroup.add(rollMesh);

    // Hanging Lantern on backpack
    const charLanternGeo = new THREE.DodecahedronGeometry(0.095, 0);
    const charLanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const charLantern = new THREE.Mesh(charLanternGeo, charLanternMat);
    charLantern.position.set(0.22, 0.9, -0.36);
    characterGroup.add(charLantern);

    const charLanternLight = new THREE.PointLight(0x38bdf8, 2.8, 5.5);
    charLanternLight.position.copy(charLantern.position);
    characterGroup.add(charLanternLight);

    // 8D. Articulated Legs & Spiked Crampon Boots
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.7, 8);
    const bootGeo = new THREE.BoxGeometry(0.17, 0.21, 0.29);

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.16, 0.76, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, parkaMat);
    leftLegMesh.position.y = -0.33;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    const leftBoot = new THREE.Mesh(bootGeo, leatherMat);
    leftBoot.position.set(0, -0.68, 0.05);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);
    characterGroup.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, 0.76, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, parkaMat);
    rightLegMesh.position.y = -0.33;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    const rightBoot = new THREE.Mesh(bootGeo, leatherMat);
    rightBoot.position.set(0, -0.68, 0.05);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);
    characterGroup.add(rightLeg);

    // 8E. Articulated Arms & Trekking Pole
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.66, 8);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 1.4, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, parkaMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), gloveMat);
    leftGlove.position.set(0, -0.62, 0);
    leftArm.add(leftGlove);
    characterGroup.add(leftArm);

    // Right Arm with Trekking Pole
    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, parkaMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), gloveMat);
    rightGlove.position.set(0, -0.62, 0);
    rightArm.add(rightGlove);

    // Trekking Pole
    const staffGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
    const staffMesh = new THREE.Mesh(staffGeo, staffMat);
    staffMesh.position.set(0.08, -0.28, 0.22);
    staffMesh.rotation.x = -0.22;
    rightArm.add(staffMesh);

    characterGroup.add(rightArm);
    scene.add(characterGroup);

    // Initial position on trail
    const startPoint = trailCurve.getPoint(0);
    characterGroup.position.copy(startPoint);
    characterGroup.lookAt(trailCurve.getPoint(0.02));

    // --- 9. FOOTSTEP DECAL SPAWNER ---
    const footprintGeo = new THREE.PlaneGeometry(0.15, 0.28);
    footprintGeo.rotateX(-Math.PI / 2);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x0d1726,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });

    const spawnFootstep = (pos: THREE.Vector3, rotY: number) => {
      const mesh = new THREE.Mesh(footprintGeo, footprintMat);
      mesh.position.copy(pos);
      mesh.position.y += 0.03;
      mesh.rotation.y = rotY;
      scene.add(mesh);
      stateRef.current.footsteps.push({ mesh, age: 0 });

      if (stateRef.current.footsteps.length > 45) {
        const oldest = stateRef.current.footsteps.shift();
        if (oldest) {
          scene.remove(oldest.mesh);
          oldest.mesh.geometry.dispose();
        }
      }
    };

    // --- 10. CONDENSING BREATH VAPOR PUFF SYSTEM ---
    const breathGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const breathMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const spawnBreathPuff = () => {
      const forwardDir = new THREE.Vector3(0, 0, 1);
      forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterGroup.rotation.y);
      const spawnPos = characterGroup.position.clone()
        .add(new THREE.Vector3(0, 1.58, 0))
        .add(forwardDir.clone().multiplyScalar(0.24));

      for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(breathGeo, breathMat);
        mesh.position.copy(spawnPos);
        mesh.scale.setScalar(0.8 + i * 0.4);
        scene.add(mesh);

        stateRef.current.breathPuffs.push({
          mesh,
          vel: forwardDir.clone().multiplyScalar(0.015 + Math.random() * 0.01).add(new THREE.Vector3(0, 0.008, 0)),
          life: 0,
          maxLife: 1.8,
        });
      }
    };

    // --- 11. MAIN ANIMATION & RENDER LOOP ---
    let animFrameId: number;
    let lastStepTime = 0;

    const animate = () => {
      const state = stateRef.current;
      state.time += 0.016;
      const t = state.time;

      // Update Aurora time uniform
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

      // Breath vapor puff timer
      state.breathTimer += 0.016;
      if (state.breathTimer > 3.6) {
        state.breathTimer = 0;
        spawnBreathPuff();
      }

      // Update breath puffs
      for (let i = state.breathPuffs.length - 1; i >= 0; i--) {
        const puff = state.breathPuffs[i];
        puff.life += 0.016;
        puff.mesh.position.add(puff.vel);
        puff.mesh.scale.addScalar(0.012);
        const alpha = Math.max(0, (1 - puff.life / puff.maxLife) * 0.45);
        (puff.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;

        if (puff.life >= puff.maxLife) {
          scene.remove(puff.mesh);
          state.breathPuffs.splice(i, 1);
        }
      }

      // --- FIFA-STYLE IDLE & LOCOMOTION BLENDING ---
      if (isMoving) {
        // WALKING LOCOMOTION
        state.walkPhase += speed * 4.2 + 0.065;
        const phase = state.walkPhase;

        // Leg stride
        leftLeg.rotation.x = Math.sin(phase) * 0.72;
        rightLeg.rotation.x = -Math.sin(phase) * 0.72;

        // Arm counter-swing
        leftArm.rotation.x = -Math.sin(phase) * 0.62;
        rightArm.rotation.x = Math.sin(phase) * 0.52;

        // Vertical spine bounce & forward tilt on ascent
        torsoMesh.position.y = 1.1 + Math.abs(Math.sin(phase)) * 0.065;
        hoodMesh.position.y = 1.65 + Math.abs(Math.sin(phase)) * 0.065;
        packMesh.position.y = 1.18 + Math.abs(Math.sin(phase)) * 0.075;
        characterGroup.rotation.x = 0.08; // Mountain incline lean

        // Spine sway
        characterGroup.rotation.z = Math.sin(phase) * 0.038;

        // Backpack lantern swing with momentum
        charLantern.position.x = 0.22 + Math.sin(phase * 1.5) * 0.055;

        // Footstep audio and footprint placement on footstrike
        if (Math.abs(Math.sin(phase)) > 0.94 && t - lastStepTime > 0.26) {
          lastStepTime = t;
          audioEngine.playFootstep();
          const isLeft = Math.sin(phase) > 0;
          const stepOffset = new THREE.Vector3(isLeft ? -0.17 : 0.17, 0, 0);
          stepOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterGroup.rotation.y);
          spawnFootstep(currentPoint.clone().add(stepOffset), characterGroup.rotation.y);
        }
      } else {
        // FIFA-STYLE AAA LIFELIKE IDLE STANCE
        // 1. Subtle rhythmic chest expansion (breathing)
        const breath = Math.sin(t * 2.2) * 0.028;
        torsoMesh.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath);

        // 2. Procedural hip weight shifting (alternating leg rest every 4s)
        const weightShift = Math.sin(t * 0.75) * 0.048;
        leftLeg.rotation.z = weightShift * 0.6;
        rightLeg.rotation.z = -weightShift * 0.6;
        leftLeg.rotation.x = 0.06;
        rightLeg.rotation.x = -0.06;

        // 3. Head looking around at the aurora / distant summit
        hoodMesh.rotation.y = Math.sin(t * 0.4) * 0.24;
        hoodMesh.rotation.x = -0.06 + Math.cos(t * 0.45) * 0.09;

        // 4. Subtle arm & shoulder relaxing
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.06, 0.1);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.08, 0.1);
        characterGroup.rotation.z = THREE.MathUtils.lerp(characterGroup.rotation.z, 0, 0.1);
        characterGroup.rotation.x = THREE.MathUtils.lerp(characterGroup.rotation.x, 0.02, 0.1);

        // 5. Hanging lantern gentle wind swing
        charLantern.position.x = 0.22 + Math.sin(t * 2.6) * 0.028;
      }

      // --- THIRD-PERSON CAMERA RIG ---
      // Positioned behind character, framed on the RIGHT side of the screen
      const isMobile = window.innerWidth < 768;
      const camSideOffset = isMobile ? 0.2 : -1.4; // Shifts camera left so character is on the right
      const camHeight = isMobile ? 1.7 : 1.95;
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

      // --- BLIZZARD SNOW DRIFT ---
      const blizzardPos = blizzardGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < blizzardCount; i++) {
        blizzardPos[i * 3] += blizzardVelocities[i * 3];
        blizzardPos[i * 3 + 1] += blizzardVelocities[i * 3 + 1];
        blizzardPos[i * 3 + 2] += blizzardVelocities[i * 3 + 2];

        if (blizzardPos[i * 3 + 1] < camera.position.y - 6) {
          blizzardPos[i * 3 + 1] = camera.position.y + 22;
          blizzardPos[i * 3] = camera.position.x + (Math.random() - 0.5) * 60;
          blizzardPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 60;
        }
      }
      blizzardGeo.attributes.position.needsUpdate = true;

      // --- SHOOTING STARS ENGINE ANIMATION ---
      state.shootingStars.forEach((star) => {
        if (!star.active && Math.random() < 0.003) {
          star.active = true;
          star.progress = 0;
          star.start.set(
            camera.position.x + (Math.random() - 0.5) * 85,
            camera.position.y + 36 + Math.random() * 25,
            camera.position.z - 45 - Math.random() * 50
          );
          star.dir.set(-1.2 - Math.random() * 0.8, -0.6 - Math.random() * 0.4, 0.3).normalize();
          star.speed = 0.024 + Math.random() * 0.02;
          star.tail.visible = true;
          star.head.visible = true;
        }

        if (star.active) {
          star.progress += star.speed;
          const currentHead = star.start.clone().add(star.dir.clone().multiplyScalar(star.progress * 48));
          const currentTail = star.start.clone().add(star.dir.clone().multiplyScalar(Math.max(0, star.progress * 48 - 9)));

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
      cp1Ring.rotation.z += 0.024;
      crystalMesh.rotation.y += 0.038;
      crystalMesh.rotation.x = Math.sin(t * 1.6) * 0.24;
      campfireLight.intensity = 4.8 + Math.sin(t * 14.0) * 1.5;

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

    // --- 12. RESIZE HANDLER ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- 13. CLEANUP ---
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
