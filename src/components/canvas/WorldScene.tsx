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
  activeCheckpoint,
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
    footsteps: [] as { x: number; y: number; z: number; age: number; mesh: THREE.Mesh }[],
    snowParticles: null as THREE.Points | null,
    shootingStars: [] as { start: THREE.Vector3; end: THREE.Vector3; progress: number; line: THREE.Line; active: boolean }[],
    lastArrivedCheckpoint: -1,
  });

  // Keep target progress in sync
  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. THREE.JS SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040814, 0.022);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. TRAIL SPLINE (Winding Mountain Path) ---
    // Curving from bottom-right (start) up into the icy peaks
    const splinePoints = [
      new THREE.Vector3(1.6, 0.0, 7.5),     // Scene 0: Start (Hero)
      new THREE.Vector3(1.3, 0.5, 3.0),
      new THREE.Vector3(1.1, 1.2, -3.5),    // Checkpoint 1: Skills (25%)
      new THREE.Vector3(0.5, 2.3, -11.0),
      new THREE.Vector3(-0.2, 3.6, -18.5),  // Checkpoint 2: Experience Camp (55%)
      new THREE.Vector3(0.3, 5.1, -26.0),
      new THREE.Vector3(0.8, 6.7, -33.5),   // Checkpoint 3: Observatory (80%)
      new THREE.Vector3(0.2, 8.2, -41.0),
      new THREE.Vector3(0.0, 9.5, -48.0),   // Checkpoint 4: Summit Beacon (100%)
    ];
    const trailCurve = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal', 0.5);

    // --- 3. LIGHTING SYSTEM (Cold Moonlight + Warm Lantern Glows) ---
    const ambientLight = new THREE.AmbientLight(0x0c1b33, 1.2);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x1e3a5f, 0x050b14, 0.9);
    scene.add(hemisphereLight);

    // Stark Moonlight casting soft shadows
    const moonLight = new THREE.DirectionalLight(0xd4e8ff, 2.6);
    moonLight.position.set(-25, 45, -30);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 120;
    moonLight.shadow.camera.left = -30;
    moonLight.shadow.camera.right = 30;
    moonLight.shadow.camera.top = 30;
    moonLight.shadow.camera.bottom = -30;
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight);

    // --- 4. CELESTIAL SKY: MOON, AURORA SHADER, STARFIELD ---
    // 4A. Hyper-realistic Moon
    const moonGeo = new THREE.SphereGeometry(4.5, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xf0f6ff,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-24, 40, -85);
    scene.add(moonMesh);

    // Moon Glow Halo
    const moonHaloGeo = new THREE.PlaneGeometry(24, 24);
    const moonHaloMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const moonHalo = new THREE.Mesh(moonHaloGeo, moonHaloMat);
    moonHalo.position.copy(moonMesh.position);
    moonHalo.position.z += 0.5;
    scene.add(moonHalo);

    // 4B. Shimmering GLSL Aurora Borealis Curtains
    const auroraGeo = new THREE.CylinderGeometry(110, 110, 35, 64, 24, true);
    const auroraUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x00ff9d) }, // Neon Emerald
      uColor2: { value: new THREE.Color(0x38bdf8) }, // Ice Blue
      uColor3: { value: new THREE.Color(0xa855f7) }, // Cosmic Violet
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
          // Organic ribbon waves
          float wave1 = sin(pos.x * 0.04 + uTime * 0.7) * 4.0;
          float wave2 = cos(pos.z * 0.05 + uTime * 0.5) * 3.5;
          pos.y += wave1 + wave2;
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
          // Vertical fade
          float vFade = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
          
          // Organic shimmer curtains
          float curtain = sin(vPos.x * 0.08 + uTime * 0.9 + sin(vPos.z * 0.05 + uTime * 0.4) * 3.0);
          curtain = smoothstep(-0.2, 0.8, curtain);

          // Dynamic 3-color blend
          vec3 col = mix(uColor1, uColor2, sin(vUv.x * 6.28 + uTime * 0.3) * 0.5 + 0.5);
          col = mix(col, uColor3, cos(vPos.z * 0.04 + uTime * 0.4) * 0.5 + 0.5);

          float alpha = vFade * curtain * 0.55;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.position.set(0, 30, -35);
    scene.add(auroraMesh);

    // 4C. Twinkling Starfield
    const starCount = 2400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 140 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.2); // Upper hemisphere only

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) + 15;
      const z = radius * Math.sin(phi) * Math.sin(theta);

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Color temperature
      const temp = Math.random();
      if (temp > 0.8) {
        starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Pale blue
      } else if (temp > 0.6) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 0.8; // Warm gold
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;  // Pure white
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- 5. GLACIATED MOUNTAIN RANGES & PROCEDURAL TERRAIN ---
    // 5A. Backdrop Distant Peak
    const createMountainPeak = (x: number, y: number, z: number, scaleX: number, scaleY: number, scaleZ: number) => {
      const geo = new THREE.ConeGeometry(scaleX, scaleY, 7, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0f1d33,
        roughness: 0.85,
        metalness: 0.15,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + scaleY / 2, z);
      mesh.scale.set(1, 1, scaleZ / scaleX);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    // Imposing distant glaciated peaks
    createMountainPeak(0, 10, -75, 45, 65, 35);       // Central Zenith
    createMountainPeak(-40, 5, -65, 35, 48, 28);     // Left Ridge
    createMountainPeak(38, 6, -68, 38, 52, 30);      // Right Ridge
    createMountainPeak(-20, 3, -50, 24, 32, 20);     // Mid Left
    createMountainPeak(22, 4, -52, 26, 36, 22);      // Mid Right

    // 5B. Mountain Terrain Ground
    const terrainGeo = new THREE.PlaneGeometry(75, 90, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);
    
    // Deform terrain with natural mountain slopes
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const px = posAttr.getX(i);
      const pz = posAttr.getZ(i);
      
      // Slope rising towards the distant mountain
      const slope = ( -pz + 30 ) * 0.14;
      // Undulation
      const bump = Math.sin(px * 0.18) * Math.cos(pz * 0.14) * 1.6 + Math.sin(px * 0.35 + pz * 0.2) * 0.8;
      // Flatten near the central trail path
      const distFromCenter = Math.abs(px - (Math.sin(pz * 0.08) * 2.0));
      const pathFactor = Math.min(1.0, distFromCenter * 0.3);
      
      posAttr.setY(i, (slope + bump) * pathFactor);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x14233c,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(0, 0, -20);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 5C. Winding Snow Trail Path Ribbon
    const trailRibbonGeo = new THREE.BufferGeometry();
    const trailSegments = 80;
    const trailWidth = 1.4;
    const trailPositions = new Float32Array(trailSegments * 2 * 3);

    for (let i = 0; i < trailSegments; i++) {
      const u = i / (trailSegments - 1);
      const pt = trailCurve.getPoint(u);
      const tangent = trailCurve.getTangent(u);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const left = pt.clone().add(normal.clone().multiplyScalar(trailWidth * 0.5));
      const right = pt.clone().add(normal.clone().multiplyScalar(-trailWidth * 0.5));

      trailPositions[i * 6] = left.x;
      trailPositions[i * 6 + 1] = left.y + 0.02;
      trailPositions[i * 6 + 2] = left.z;

      trailPositions[i * 6 + 3] = right.x;
      trailPositions[i * 6 + 4] = right.y + 0.02;
      trailPositions[i * 6 + 5] = right.z;
    }
    trailRibbonGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    
    // Generate indices for triangle strip
    const trailIndices = [];
    for (let i = 0; i < trailSegments - 1; i++) {
      const base = i * 2;
      trailIndices.push(base, base + 1, base + 2);
      trailIndices.push(base + 1, base + 3, base + 2);
    }
    trailRibbonGeo.setIndex(trailIndices);
    trailRibbonGeo.computeVertexNormals();

    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x223a5e, // Frosty beaten snow path
      roughness: 0.65,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    const trailRibbon = new THREE.Mesh(trailRibbonGeo, trailMat);
    trailRibbon.receiveShadow = true;
    scene.add(trailRibbon);

    // 5D. Blizzard Snow Dust Particles
    const blizzardCount = 1600;
    const blizzardGeo = new THREE.BufferGeometry();
    const blizzardPositions = new Float32Array(blizzardCount * 3);
    const blizzardVelocities = new Float32Array(blizzardCount * 3);

    for (let i = 0; i < blizzardCount; i++) {
      blizzardPositions[i * 3] = (Math.random() - 0.5) * 60;
      blizzardPositions[i * 3 + 1] = Math.random() * 25;
      blizzardPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 15;

      blizzardVelocities[i * 3] = -0.06 - Math.random() * 0.08;     // Drift left
      blizzardVelocities[i * 3 + 1] = -0.03 - Math.random() * 0.04; // Fall down
      blizzardVelocities[i * 3 + 2] = -0.02 - Math.random() * 0.04;
    }
    blizzardGeo.setAttribute('position', new THREE.BufferAttribute(blizzardPositions, 3));

    const blizzardMat = new THREE.PointsMaterial({
      color: 0xd8ecff,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const blizzardPoints = new THREE.Points(blizzardGeo, blizzardMat);
    scene.add(blizzardPoints);
    stateRef.current.snowParticles = blizzardPoints;

    // --- 6. CHECKPOINT 3D PROPS & BEACONS ---
    // Checkpoint 1 (25% progress): Wooden Guidepost of Mastery
    const cp1Group = new THREE.Group();
    const cp1Pos = trailCurve.getPoint(0.25);
    cp1Group.position.copy(cp1Pos).add(new THREE.Vector3(-1.4, 0, -0.2));

    // Wooden post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x452b1a, roughness: 0.9 });
    const postMesh = new THREE.Mesh(postGeo, woodMat);
    postMesh.position.y = 1.1;
    postMesh.castShadow = true;
    cp1Group.add(postMesh);

    // Signboard
    const signGeo = new THREE.BoxGeometry(1.2, 0.32, 0.06);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.85 });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0.3, 1.8, 0);
    signMesh.rotation.z = -0.05;
    signMesh.castShadow = true;
    cp1Group.add(signMesh);

    // Glowing Lantern on Post
    const cp1LanternGeo = new THREE.OctahedronGeometry(0.14, 0);
    const cp1LanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cp1Lantern = new THREE.Mesh(cp1LanternGeo, cp1LanternMat);
    cp1Lantern.position.set(0.4, 1.5, 0.15);
    cp1Group.add(cp1Lantern);

    const cp1Light = new THREE.PointLight(0x38bdf8, 3.5, 7);
    cp1Light.position.copy(cp1Lantern.position);
    cp1Group.add(cp1Light);

    // Holographic Pulsing Ring Marker
    const ringGeo = new THREE.RingGeometry(0.4, 0.52, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const cp1Ring = new THREE.Mesh(ringGeo, ringMat);
    cp1Ring.position.set(0, 2.6, 0);
    cp1Ring.rotation.x = Math.PI / 2;
    cp1Group.add(cp1Ring);
    scene.add(cp1Group);

    // Checkpoint 2 (55% progress): Mountain Shelter Campsite
    const cp2Group = new THREE.Group();
    const cp2Pos = trailCurve.getPoint(0.55);
    cp2Group.position.copy(cp2Pos).add(new THREE.Vector3(-2.2, 0, -0.5));

    // Wooden A-frame shelter tent
    const tentGeo = new THREE.ConeGeometry(1.8, 2.4, 4, 1);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 });
    const tentMesh = new THREE.Mesh(tentGeo, tentMat);
    tentMesh.position.y = 1.2;
    tentMesh.rotation.y = Math.PI / 4;
    tentMesh.castShadow = true;
    cp2Group.add(tentMesh);

    // Campfire with warm glowing light
    const fireGeo = new THREE.DodecahedronGeometry(0.25, 0);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7b00 });
    const fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.position.set(1.4, 0.2, 0.8);
    cp2Group.add(fireMesh);

    const campfireLight = new THREE.PointLight(0xff8c00, 5.0, 10);
    campfireLight.position.copy(fireMesh.position);
    campfireLight.position.y += 0.3;
    cp2Group.add(campfireLight);
    scene.add(cp2Group);

    // Checkpoint 3 (80% progress): Ancient Stone Observatory Arch
    const cp3Group = new THREE.Group();
    const cp3Pos = trailCurve.getPoint(0.8);
    cp3Group.position.copy(cp3Pos).add(new THREE.Vector3(1.8, 0, -0.4));

    // Stone Pillar Arch
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95, flatShading: true });
    const pillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.45), stoneMat);
    pillar1.position.set(-0.9, 1.6, 0);
    pillar1.castShadow = true;
    cp3Group.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.45), stoneMat);
    pillar2.position.set(0.9, 1.6, 0);
    pillar2.castShadow = true;
    cp3Group.add(pillar2);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.45, 0.55), stoneMat);
    lintel.position.set(0, 3.3, 0);
    lintel.castShadow = true;
    cp3Group.add(lintel);

    // Floating Celestial Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.35, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.set(0, 2.2, 0);
    cp3Group.add(crystalMesh);

    const crystalLight = new THREE.PointLight(0xc084fc, 4.0, 8);
    crystalLight.position.copy(crystalMesh.position);
    cp3Group.add(crystalLight);
    scene.add(cp3Group);

    // Checkpoint 4 (100% progress): Summit Beacon Flare & Apex Cairn
    const cp4Group = new THREE.Group();
    const cp4Pos = trailCurve.getPoint(1.0);
    cp4Group.position.copy(cp4Pos).add(new THREE.Vector3(0, 0, -1.2));

    // Apex Stone Cairn
    const cairnGeo = new THREE.ConeGeometry(0.9, 1.6, 6);
    const cairnMesh = new THREE.Mesh(cairnGeo, stoneMat);
    cairnMesh.position.y = 0.8;
    cairnMesh.castShadow = true;
    cp4Group.add(cairnMesh);

    // Glowing Golden Beacon
    const beaconGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 2.0, 0);
    cp4Group.add(beaconMesh);

    const summitLight = new THREE.PointLight(0xfef08a, 6.0, 14);
    summitLight.position.copy(beaconMesh.position);
    cp4Group.add(summitLight);
    scene.add(cp4Group);

    // --- 7. DETAILED 3D ADVENTURER CHARACTER RIG ---
    // (Strictly positioned on the RIGHT side, facing away towards the mountain)
    const characterGroup = new THREE.Group();
    characterGroup.castShadow = true;

    // 7A. Torso (Parka with Winter Fur Trim)
    const parkaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const furMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.95 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });

    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.72, 8);
    const torsoMesh = new THREE.Mesh(torsoGeo, parkaMat);
    torsoMesh.position.y = 1.05;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    // Fur collar
    const furGeo = new THREE.TorusGeometry(0.24, 0.08, 8, 16);
    const furMesh = new THREE.Mesh(furGeo, furMat);
    furMesh.position.set(0, 1.42, 0);
    furMesh.rotation.x = Math.PI / 2;
    characterGroup.add(furMesh);

    // 7B. Head & Hood with Reflective Goggles
    const hoodGeo = new THREE.SphereGeometry(0.21, 16, 16);
    const hoodMesh = new THREE.Mesh(hoodGeo, parkaMat);
    hoodMesh.position.set(0, 1.58, 0);
    hoodMesh.castShadow = true;
    characterGroup.add(hoodMesh);

    // Goggles strap on back of hood
    const goggleStrapGeo = new THREE.TorusGeometry(0.22, 0.02, 6, 12);
    const goggleStrap = new THREE.Mesh(goggleStrapGeo, leatherMat);
    goggleStrap.position.copy(hoodMesh.position);
    goggleStrap.rotation.x = Math.PI / 2.2;
    characterGroup.add(goggleStrap);

    // 7C. Expedition Backpack with Hanging Lantern & Ice Axe
    const packGeo = new THREE.BoxGeometry(0.36, 0.52, 0.24);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const packMesh = new THREE.Mesh(packGeo, packMat);
    packMesh.position.set(0, 1.1, -0.22); // On character's back (facing camera)
    packMesh.castShadow = true;
    characterGroup.add(packMesh);

    // Bedroll on top of backpack
    const rollGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.44, 12);
    const rollMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.9 });
    const rollMesh = new THREE.Mesh(rollGeo, rollMat);
    rollMesh.position.set(0, 1.4, -0.22);
    rollMesh.rotation.z = Math.PI / 2;
    characterGroup.add(rollMesh);

    // Hanging Lantern on backpack
    const charLanternGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const charLanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const charLantern = new THREE.Mesh(charLanternGeo, charLanternMat);
    charLantern.position.set(0.18, 0.85, -0.32);
    characterGroup.add(charLantern);

    const charLanternLight = new THREE.PointLight(0x38bdf8, 2.2, 4.5);
    charLanternLight.position.copy(charLantern.position);
    characterGroup.add(charLanternLight);

    // 7D. Articulated Limbs
    // Left & Right Legs
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.65, 8);
    const bootGeo = new THREE.BoxGeometry(0.15, 0.18, 0.26);

    // Left Leg Group
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, parkaMat);
    leftLegMesh.position.y = -0.3;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    const leftBoot = new THREE.Mesh(bootGeo, leatherMat);
    leftBoot.position.set(0, -0.62, 0.04);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);
    characterGroup.add(leftLeg);

    // Right Leg Group
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, parkaMat);
    rightLegMesh.position.y = -0.3;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    const rightBoot = new THREE.Mesh(bootGeo, leatherMat);
    rightBoot.position.set(0, -0.62, 0.04);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);
    characterGroup.add(rightLeg);

    // Left & Right Arms
    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.62, 8);
    
    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32, 1.35, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, parkaMat);
    leftArmMesh.position.y = -0.28;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    characterGroup.add(leftArm);

    // Right Arm with Hiking Pole
    const rightArm = new THREE.Group();
    rightArm.position.set(0.32, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, parkaMat);
    rightArmMesh.position.y = -0.28;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);

    // Walking Staff
    const staffGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const staffMesh = new THREE.Mesh(staffGeo, staffMat);
    staffMesh.position.set(0.08, -0.25, 0.18);
    staffMesh.rotation.x = -0.2;
    rightArm.add(staffMesh);

    characterGroup.add(rightArm);

    // Add character to scene
    scene.add(characterGroup);

    // Position character initially on trail
    const startPoint = trailCurve.getPoint(0);
    characterGroup.position.copy(startPoint);
    characterGroup.lookAt(trailCurve.getPoint(0.02));

    // --- 8. ANIMATION & RENDER LOOP (FIFA-STYLE IDLE + SCROLL LOCOMOTION) ---
    let animFrameId: number;

    const animate = () => {
      const state = stateRef.current;
      state.time += 0.016;
      const t = state.time;

      // Update GLSL Aurora time uniform
      auroraUniforms.uTime.value = t;

      // Smooth scroll lerp (damping for physical momentum)
      const delta = state.targetProgress - state.scrollProgress;
      state.scrollProgress += delta * 0.08;
      state.velocity = (state.scrollProgress - state.lastProgress) * 60;
      state.lastProgress = state.scrollProgress;

      const p = Math.max(0, Math.min(1, state.scrollProgress));
      const speed = Math.abs(state.velocity);
      const isMoving = speed > 0.01;

      // Update Character Position along 3D CatmullRom Curve
      const currentPoint = trailCurve.getPoint(p);
      const lookAheadP = Math.min(1.0, p + 0.015);
      const targetLook = trailCurve.getPoint(lookAheadP);

      characterGroup.position.copy(currentPoint);
      characterGroup.lookAt(targetLook.x, currentPoint.y, targetLook.z);

      // --- FIFA-STYLE IDLE & LOCOMOTION BLENDING ---
      if (isMoving) {
        // WALKING LOCOMOTION
        state.walkPhase += speed * 3.8 + 0.06;
        const phase = state.walkPhase;

        // Leg stride
        leftLeg.rotation.x = Math.sin(phase) * 0.65;
        rightLeg.rotation.x = -Math.sin(phase) * 0.65;

        // Arm counter-swing
        leftArm.rotation.x = -Math.sin(phase) * 0.55;
        rightArm.rotation.x = Math.sin(phase) * 0.45;

        // Vertical spine bounce
        torsoMesh.position.y = 1.05 + Math.abs(Math.sin(phase)) * 0.05;
        hoodMesh.position.y = 1.58 + Math.abs(Math.sin(phase)) * 0.05;
        packMesh.position.y = 1.1 + Math.abs(Math.sin(phase)) * 0.06;

        // Spine sway
        characterGroup.rotation.z = Math.sin(phase) * 0.03;

        // Backpack lantern swing with momentum
        charLantern.position.x = 0.18 + Math.sin(phase * 1.5) * 0.04;

        // Footstep crunch sound & snow dust
        if (Math.abs(Math.sin(phase)) > 0.95) {
          audioEngine.playFootstep();
        }
      } else {
        // FIFA-STYLE LIFELIKE IDLE STANCE
        // 1. Subtle breathing chest rise/fall
        const breath = Math.sin(t * 2.2) * 0.02;
        torsoMesh.scale.set(1 + breath, 1 + breath * 0.5, 1 + breath);
        
        // 2. Hip weight shift (swaying slightly side-to-side every few seconds)
        const weightShift = Math.sin(t * 0.8) * 0.04;
        leftLeg.rotation.z = weightShift * 0.5;
        rightLeg.rotation.z = -weightShift * 0.5;
        leftLeg.rotation.x = 0.05;
        rightLeg.rotation.x = -0.05;

        // 3. Head looking around at the aurora / distant mountain
        hoodMesh.rotation.y = Math.sin(t * 0.4) * 0.18;
        hoodMesh.rotation.x = -0.05 + Math.cos(t * 0.5) * 0.08;

        // 4. Subtle arm and shoulder relaxing
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.05, 0.1);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.08, 0.1);
        characterGroup.rotation.z = THREE.MathUtils.lerp(characterGroup.rotation.z, 0, 0.1);

        // 5. Lantern gentle wind swing
        charLantern.position.x = 0.18 + Math.sin(t * 2.8) * 0.02;
      }

      // --- THIRD-PERSON CAMERA RIG ---
      // Camera stays positioned behind the character, looking forward along trail
      // Responsive offset ensures character is on the RIGHT side, leaving left clear for UI
      const isMobile = window.innerWidth < 768;
      const camSideOffset = isMobile ? 0.3 : -1.2; // Shift camera left so character appears on right
      const camHeight = isMobile ? 1.6 : 1.8;
      const camDistance = isMobile ? 3.8 : 4.4;

      const camTangent = trailCurve.getTangent(p);
      const camNormal = new THREE.Vector3(-camTangent.z, 0, camTangent.x).normalize();

      const targetCamPos = currentPoint.clone()
        .sub(camTangent.clone().multiplyScalar(camDistance))
        .add(camNormal.clone().multiplyScalar(camSideOffset));
      targetCamPos.y += camHeight;

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos, 0.08);

      const lookTarget = currentPoint.clone().add(camTangent.clone().multiplyScalar(6.0));
      lookTarget.y += 1.4;
      camera.lookAt(lookTarget);

      // --- BLIZZARD PARTICLE ANIMATION ---
      const blizzardPos = blizzardGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < blizzardCount; i++) {
        blizzardPos[i * 3] += blizzardVelocities[i * 3];
        blizzardPos[i * 3 + 1] += blizzardVelocities[i * 3 + 1];
        blizzardPos[i * 3 + 2] += blizzardVelocities[i * 3 + 2];

        // Wrap around relative to camera position
        if (blizzardPos[i * 3 + 1] < camera.position.y - 5) {
          blizzardPos[i * 3 + 1] = camera.position.y + 18;
          blizzardPos[i * 3] = camera.position.x + (Math.random() - 0.5) * 50;
          blizzardPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 50;
        }
      }
      blizzardGeo.attributes.position.needsUpdate = true;

      // --- CHECKPOINT ARRIVAL AUDIO & BEACON ROTATION ---
      cp1Ring.rotation.z += 0.02;
      crystalMesh.rotation.y += 0.03;
      crystalMesh.rotation.x = Math.sin(t * 1.5) * 0.2;
      campfireLight.intensity = 4.0 + Math.sin(t * 12.0) * 1.2; // Flickering fire

      // Checkpoint trigger detection
      const checkpointRanges = [
        { id: 1, p: 0.25 },
        { id: 2, p: 0.55 },
        { id: 3, p: 0.80 },
        { id: 4, p: 1.00 },
      ];

      checkpointRanges.forEach(({ id, p: targetP }) => {
        if (Math.abs(p - targetP) < 0.04 && state.lastArrivedCheckpoint !== id) {
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

    // --- 9. WINDOW RESIZE HANDLER ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- 10. CLEANUP ON UNMOUNT ---
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
