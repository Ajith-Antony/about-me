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
    shootingStars: [] as {
      start: THREE.Vector3; dir: THREE.Vector3; progress: number;
      speed: number; active: boolean; tail: THREE.Line; head: THREE.Mesh;
    }[],
  });

  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─────────────────────────────────────────────
    // 1. RENDERER / SCENE / CAMERA
    // ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    // Deep near-black fog — Monoio void atmosphere
    scene.fog = new THREE.FogExp2(0x01030a, 0.018);
    scene.background = new THREE.Color(0x01030a);

    const camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.1, 1600
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ─────────────────────────────────────────────
    // 2. PROCEDURAL PBR TEXTURES
    // ─────────────────────────────────────────────
    const { normalMap: snowNormal, roughnessMap: snowRoughness } = generateSnowTextures();
    const rockNormal = generateRockNormalMap();
    const moonAlbedo = generateMoonTexture();
    const parkaTexture = generateParkaTexture();

    // ─────────────────────────────────────────────
    // 3. TRAIL SPLINE — character walks RIGHT-SIDE of frame
    // ─────────────────────────────────────────────
    const splinePoints = [
      new THREE.Vector3(3.2, 0.0,  9.0),
      new THREE.Vector3(2.6, 0.5,  3.5),
      new THREE.Vector3(2.0, 1.2, -3.0),
      new THREE.Vector3(1.2, 2.4, -10.0),
      new THREE.Vector3(0.5, 3.8, -18.0),
      new THREE.Vector3(1.0, 5.2, -26.0),
      new THREE.Vector3(1.8, 6.7, -34.0),
      new THREE.Vector3(1.0, 8.2, -42.0),
      new THREE.Vector3(0.4, 9.5, -50.0),
    ];
    const trailCurve = new THREE.CatmullRomCurve3(splinePoints, false, 'centripetal', 0.5);

    // ─────────────────────────────────────────────
    // 4. LIGHTING — cold moonlight + aurora glow
    // ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x04091a, 1.8));
    scene.add(new THREE.HemisphereLight(0x0d2040, 0x010306, 1.4));

    // Moonlight (blue-white, sharp directional)
    const moonLight = new THREE.DirectionalLight(0xdbeafe, 3.5);
    moonLight.position.set(-40, 60, -50);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 200;
    moonLight.shadow.camera.left = -55;
    moonLight.shadow.camera.right = 55;
    moonLight.shadow.camera.top = 55;
    moonLight.shadow.camera.bottom = -55;
    moonLight.shadow.bias = -0.0003;
    scene.add(moonLight);

    // Aurora emission lights — concentrated on RIGHT side of scene
    const auroraGreen = new THREE.PointLight(0x00ff9d, 5.0, 120);
    auroraGreen.position.set(30, 40, -30);
    scene.add(auroraGreen);

    const auroraCyan = new THREE.PointLight(0x00e5ff, 3.5, 100);
    auroraCyan.position.set(50, 50, -50);
    scene.add(auroraCyan);

    const auroraViolet = new THREE.PointLight(0x8b5cf6, 2.5, 90);
    auroraViolet.position.set(20, 60, -70);
    scene.add(auroraViolet);

    // ─────────────────────────────────────────────
    // 5. MOON — upper-left, large, with halos
    // ─────────────────────────────────────────────
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-55, 55, -130);

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(7.5, 64, 64),
      new THREE.MeshStandardMaterial({
        map: moonAlbedo, roughness: 0.82, metalness: 0.06,
        emissive: new THREE.Color(0xdbeafe), emissiveIntensity: 0.5,
      })
    );
    moonGroup.add(moonMesh);

    // Halo layers
    [{ size: 50, opacity: 0.45, color: 0x93c5fd }, { size: 90, opacity: 0.2, color: 0x60a5fa }].forEach(h => {
      const hm = new THREE.Mesh(
        new THREE.PlaneGeometry(h.size, h.size),
        new THREE.MeshBasicMaterial({
          color: h.color, transparent: true, opacity: h.opacity,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        })
      );
      hm.position.z = 0.1;
      moonGroup.add(hm);
    });
    scene.add(moonGroup);

    // ─────────────────────────────────────────────
    // 6. AURORA BOREALIS — GLSL shader, RIGHT side concentrated
    // ─────────────────────────────────────────────
    const auroraUniforms = {
      uTime:   { value: 0 },
      uColor1: { value: new THREE.Color(0x00ff9d) }, // emerald
      uColor2: { value: new THREE.Color(0x00f0ff) }, // cyan
      uColor3: { value: new THREE.Color(0x8b5cf6) }, // violet
      uColor4: { value: new THREE.Color(0xf43f5e) }, // rose fringe
    };

    const auroraMat = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vElev;
        uniform float uTime;
        void main() {
          vUv  = uv;
          vPos = position;
          vec3 p = position;
          // Wave amplitude is stronger towards the +X right side
          float rightBias = smoothstep(-80.0, 100.0, p.x);
          float w1 = sin(p.x * 0.038 + uTime * 0.72) * (7.0 + rightBias * 6.0);
          float w2 = cos(p.z * 0.048 + uTime * 0.55) * 5.5;
          float w3 = sin(p.x * 0.085 + p.z * 0.065 + uTime * 1.1) * 3.5;
          p.y += w1 + w2 + w3;
          vElev = w1 + w2 + w3;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        varying float vElev;
        uniform float uTime;
        uniform vec3 uColor1, uColor2, uColor3, uColor4;
        void main() {
          float vFade = smoothstep(0.0, 0.38, vUv.y) * smoothstep(1.0, 0.58, vUv.y);
          float r1 = sin(vPos.x * 0.11 + uTime * 1.05 + sin(vPos.z * 0.06 + uTime * 0.5) * 4.0);
          float r2 = cos(vPos.z * 0.14 - uTime * 0.82 + sin(vPos.x * 0.08 + uTime * 0.6) * 2.5);
          r1 = smoothstep(-0.1, 0.9, r1);
          r2 = smoothstep(-0.1, 0.92, r2);
          float curtain = r1 * 0.65 + r2 * 0.35;
          vec3 col = mix(uColor1, uColor2, sin(vUv.x * 6.28 + uTime * 0.32) * 0.5 + 0.5);
          col = mix(col, uColor3, cos(vPos.z * 0.045 + uTime * 0.42) * 0.5 + 0.5);
          col = mix(col, uColor4, clamp(vElev * 0.16, 0.0, 1.0) * 0.45);
          // Bias intensity towards +X (right)
          float rightBias = smoothstep(-50.0, 80.0, vPos.x) * 0.5 + 0.5;
          float alpha = vFade * curtain * rightBias * 0.82;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false,
    });

    const auroraMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(160, 160, 60, 96, 32, true),
      auroraMat
    );
    auroraMesh.position.set(25, 42, -40);
    scene.add(auroraMesh);

    // ─────────────────────────────────────────────
    // 7. STARFIELD — 4 000 stars
    // ─────────────────────────────────────────────
    const starCount = 4000;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const palettes: [number, number, number][] = [
      [0.65, 0.88, 1.0], [1.0, 0.95, 0.75], [0.88, 0.75, 1.0], [1, 1, 1],
    ];
    for (let i = 0; i < starCount; i++) {
      const r = 200 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15);
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) + 10;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const pal = palettes[Math.floor(Math.random() * palettes.length)];
      starCol[i * 3] = pal[0]; starCol[i * 3 + 1] = pal[1]; starCol[i * 3 + 2] = pal[2];
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 1.5, vertexColors: true, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending,
    })));

    // ─────────────────────────────────────────────
    // 8. TERRAIN — reflective icy ground (Monoio mirror lake)
    // ─────────────────────────────────────────────
    const terrGeo = new THREE.PlaneGeometry(130, 150, 100, 100);
    terrGeo.rotateX(-Math.PI / 2);
    const tPos = terrGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const px = tPos.getX(i);
      const pz = tPos.getZ(i);
      const slope = Math.max(0, (-pz + 30)) * 0.14;
      const hills  = Math.sin(px * 0.10) * Math.cos(pz * 0.08) * 1.8 + Math.sin(px * 0.22 + pz * 0.12) * 0.8;
      const pathDist = Math.abs(px - Math.sin(pz * 0.06) * 2.2);
      tPos.setY(i, (slope + hills) * Math.min(1, pathDist * 0.3));
    }
    terrGeo.computeVertexNormals();
    const terrMesh = new THREE.Mesh(
      terrGeo,
      new THREE.MeshStandardMaterial({
        color: 0x06101e,    // dark blue-black ice
        roughness: 0.28,    // glassy reflective
        metalness: 0.72,
        normalMap: snowNormal,
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughnessMap: snowRoughness,
      })
    );
    terrMesh.position.set(0, 0, -28);
    terrMesh.receiveShadow = true;
    scene.add(terrMesh);

    // ─────────────────────────────────────────────
    // 9. MOUNTAIN PEAKS
    // ─────────────────────────────────────────────
    const addPeak = (x: number, baseY: number, z: number, rx: number, ry: number, rz: number) => {
      const geo = new THREE.ConeGeometry(rx, ry, 12, 6);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vz = pos.getZ(i);
        if (pos.getY(i) < ry * 0.5) {
          pos.setX(i, vx + Math.sin(vx * 0.4) * rx * 0.18);
          pos.setZ(i, vz + Math.cos(vz * 0.4) * rx * 0.18);
        }
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x0b1828, roughness: 0.78, metalness: 0.22,
        normalMap: rockNormal, normalScale: new THREE.Vector2(1.3, 1.3),
      }));
      m.position.set(x, baseY + ry / 2, z);
      m.scale.set(1, 1, rz / rx);
      m.rotation.y = Math.random() * Math.PI * 2;
      m.castShadow = true;
      scene.add(m);
    };

    addPeak(0,   16, -90, 58, 84, 48);   // Summit apex
    addPeak(-55, 8,  -78, 48, 64, 36);   // Left ridge
    addPeak(52,  9,  -82, 50, 68, 38);   // Right ridge
    addPeak(-30, 4,  -62, 32, 44, 28);
    addPeak(32,  5,  -65, 34, 48, 30);
    addPeak(-80, 4, -100, 55, 60, 44);
    addPeak(80,  5, -104, 58, 62, 46);

    // ─────────────────────────────────────────────
    // 10. BLIZZARD PARTICLES
    // ─────────────────────────────────────────────
    const blizzardCount = 2000;
    const bPos = new Float32Array(blizzardCount * 3);
    const bVel = new Float32Array(blizzardCount * 3);
    for (let i = 0; i < blizzardCount; i++) {
      bPos[i * 3]     = (Math.random() - 0.5) * 90;
      bPos[i * 3 + 1] = Math.random() * 36;
      bPos[i * 3 + 2] = (Math.random() - 0.5) * 110 - 25;
      bVel[i * 3]     = -0.08 - Math.random() * 0.10;
      bVel[i * 3 + 1] = -0.04 - Math.random() * 0.05;
      bVel[i * 3 + 2] = -0.03 - Math.random() * 0.05;
    }
    const blizzardGeo = new THREE.BufferGeometry();
    blizzardGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
    scene.add(new THREE.Points(blizzardGeo, new THREE.PointsMaterial({
      color: 0xe0f2fe, size: 0.32, transparent: true, opacity: 0.68,
      blending: THREE.AdditiveBlending,
    })));

    // ─────────────────────────────────────────────
    // 11. CHECKPOINT PROPS
    // ─────────────────────────────────────────────
    const woodMat  = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.88 });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1a2840, roughness: 0.9,
      normalMap: rockNormal, normalScale: new THREE.Vector2(1.1, 1.1),
    });

    const addLight = (color: number, intensity: number, distance: number, pos: THREE.Vector3) => {
      const l = new THREE.PointLight(color, intensity, distance);
      l.position.copy(pos);
      scene.add(l);
      return l;
    };

    // CP1 — Signpost
    const cp1Pos = trailCurve.getPoint(0.25).add(new THREE.Vector3(-1.8, 0, 0));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 8), woodMat);
    post.position.copy(cp1Pos).setComponent(1, cp1Pos.y + 1.3);
    post.castShadow = true;
    scene.add(post);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.42, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x54321d, roughness: 0.82 }));
    sign.position.copy(cp1Pos).setComponent(1, cp1Pos.y + 2.1);
    sign.position.x += 0.4;
    scene.add(sign);
    const cp1Light = addLight(0x38bdf8, 5, 10, cp1Pos.clone().add(new THREE.Vector3(0, 1.5, 0)));

    // CP2 — Campfire tent
    const cp2Pos = trailCurve.getPoint(0.55).add(new THREE.Vector3(-2.6, 0, 0));
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.0, 4), stoneMat);
    tent.position.copy(cp2Pos).setComponent(1, cp2Pos.y + 1.5);
    tent.rotation.y = Math.PI / 4;
    tent.castShadow = true;
    scene.add(tent);
    const campfireLight = addLight(0xff8c00, 7, 16, cp2Pos.clone().add(new THREE.Vector3(1.8, 0.5, 1)));

    // CP3 — Stone arch / observatory
    const cp3Pos = trailCurve.getPoint(0.80).add(new THREE.Vector3(2.2, 0, 0));
    [[-1.1, 1.9], [1.1, 1.9]].forEach(([ox, oy]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.8, 0.55), stoneMat);
      pillar.position.copy(cp3Pos).add(new THREE.Vector3(ox, oy, 0));
      pillar.castShadow = true;
      scene.add(pillar);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.65), stoneMat);
    lintel.position.copy(cp3Pos).add(new THREE.Vector3(0, 3.9, 0));
    scene.add(lintel);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    crystal.position.copy(cp3Pos).add(new THREE.Vector3(0, 2.5, 0));
    scene.add(crystal);
    const crystalLight = addLight(0xc084fc, 5.5, 11, crystal.position);

    // CP4 — Summit cairn + beacon
    const cp4Pos = trailCurve.getPoint(1.0).add(new THREE.Vector3(0, 0, -1.5));
    const cairn = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 6), stoneMat);
    cairn.position.copy(cp4Pos).setComponent(1, cp4Pos.y + 1.1);
    cairn.castShadow = true;
    scene.add(cairn);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    beacon.position.copy(cp4Pos).add(new THREE.Vector3(0, 2.6, 0));
    scene.add(beacon);
    const summitLight = addLight(0xfef08a, 9, 22, beacon.position);

    // ─────────────────────────────────────────────
    // 12. EXPLORER CHARACTER RIG
    // ─────────────────────────────────────────────
    const charGroup = new THREE.Group();
    const parkaMat = new THREE.MeshStandardMaterial({ map: parkaTexture, roughness: 0.74, metalness: 0.1 });
    const furMat   = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
    const leatMat  = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.65 });
    const packMat  = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.85 });
    const darkMat  = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    const addMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number, cast = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      if (cast) m.castShadow = true;
      charGroup.add(m);
      return m;
    };

    // torso
    const torso = addMesh(new THREE.CylinderGeometry(0.28, 0.32, 0.8, 12), parkaMat, 0, 1.1, 0);
    // fur collar
    addMesh(new THREE.TorusGeometry(0.28, 0.1, 8, 16), furMat, 0, 1.5, 0);
    // hood
    const hood = addMesh(new THREE.SphereGeometry(0.24, 16, 16), parkaMat, 0, 1.66, 0);
    // goggles strap
    const goggle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.022, 6, 14), leatMat);
    goggle.rotation.x = Math.PI / 2.1;
    goggle.position.set(0, 1.66, 0);
    charGroup.add(goggle);

    // backpack
    const pack = addMesh(new THREE.BoxGeometry(0.42, 0.6, 0.3), packMat, 0, 1.18, -0.28);
    // bedroll on pack
    addMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.9 }), 0, 1.54, -0.28);
    // hanging lantern
    const charLantern = addMesh(new THREE.DodecahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }), 0.24, 0.9, -0.38);
    const charLanternLight = new THREE.PointLight(0x38bdf8, 3.0, 6.0);
    charLanternLight.position.set(0.24, 0.9, -0.38);
    charGroup.add(charLanternLight);

    // legs
    const leftLeg  = new THREE.Group(); leftLeg.position.set(-0.16, 0.76, 0); charGroup.add(leftLeg);
    const rightLeg = new THREE.Group(); rightLeg.position.set(0.16, 0.76, 0);  charGroup.add(rightLeg);
    [leftLeg, rightLeg].forEach((leg, i) => {
      const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.72, 8), parkaMat);
      lm.position.y = -0.34; lm.castShadow = true; leg.add(lm);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.3), leatMat);
      boot.position.set(0, -0.7, 0.06); boot.castShadow = true; leg.add(boot);
    });

    // arms
    const leftArm  = new THREE.Group(); leftArm.position.set(-0.36, 1.4, 0);  charGroup.add(leftArm);
    const rightArm = new THREE.Group(); rightArm.position.set(0.36, 1.4, 0);  charGroup.add(rightArm);
    [leftArm, rightArm].forEach((arm) => {
      const am = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.07, 0.68, 8), parkaMat);
      am.position.y = -0.32; am.castShadow = true; arm.add(am);
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.078, 8, 8), darkMat);
      glove.position.y = -0.64; arm.add(glove);
    });
    // trekking pole on right arm
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 }));
    staff.position.set(0.1, -0.3, 0.24); staff.rotation.x = -0.22;
    rightArm.add(staff);

    scene.add(charGroup);

    // ─────────────────────────────────────────────
    // 13. FOOTPRINT DECALS
    // ─────────────────────────────────────────────
    const footprintGeo = new THREE.PlaneGeometry(0.16, 0.30);
    footprintGeo.rotateX(-Math.PI / 2);
    const footprintMat = new THREE.MeshBasicMaterial({
      color: 0x040d1a, transparent: true, opacity: 0.7, depthWrite: false,
    });

    const spawnFootstep = (pos: THREE.Vector3, ry: number) => {
      const m = new THREE.Mesh(footprintGeo, footprintMat);
      m.position.copy(pos); m.position.y += 0.03; m.rotation.y = ry;
      scene.add(m);
      stateRef.current.footsteps.push({ mesh: m, age: 0 });
      if (stateRef.current.footsteps.length > 48) {
        const old = stateRef.current.footsteps.shift();
        if (old) { scene.remove(old.mesh); old.mesh.geometry.dispose(); }
      }
    };

    // ─────────────────────────────────────────────
    // 14. BREATH VAPOR SYSTEM
    // ─────────────────────────────────────────────
    const breathGeo = new THREE.SphereGeometry(0.085, 6, 6);
    const breathMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });

    const spawnBreath = () => {
      const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), charGroup.rotation.y);
      const pos = charGroup.position.clone().add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(fwd, 0.26);
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(breathGeo, breathMat);
        m.position.copy(pos);
        m.scale.setScalar(0.7 + i * 0.4);
        scene.add(m);
        stateRef.current.breathPuffs.push({
          mesh: m,
          vel: fwd.clone().multiplyScalar(0.014 + Math.random() * 0.012).add(new THREE.Vector3(0, 0.008, 0)),
          life: 0,
          maxLife: 1.8,
        });
      }
    };

    // ─────────────────────────────────────────────
    // 15. SHOOTING STARS
    // ─────────────────────────────────────────────
    const shooterMat = new THREE.LineBasicMaterial({
      color: 0xf0f9ff, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < 4; i++) {
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(lg, shooterMat);
      line.visible = false;
      scene.add(line);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      head.visible = false;
      scene.add(head);
      stateRef.current.shootingStars.push({
        start: new THREE.Vector3(), dir: new THREE.Vector3(),
        progress: 1, speed: 0.025, active: false, tail: line, head,
      });
    }

    // ─────────────────────────────────────────────
    // 16. MAIN ANIMATION LOOP
    // ─────────────────────────────────────────────
    let animId: number;
    let lastStepTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const st = stateRef.current;
      st.time += 0.016;
      const t = st.time;

      // Aurora time
      auroraUniforms.uTime.value = t;

      // Smooth scroll
      const dScroll = st.targetProgress - st.scrollProgress;
      st.scrollProgress += dScroll * 0.085;
      st.velocity = (st.scrollProgress - st.lastProgress) * 60;
      st.lastProgress = st.scrollProgress;
      const p = Math.max(0, Math.min(1, st.scrollProgress));
      const speed = Math.abs(st.velocity);
      const isMoving = speed > 0.015;

      // Character position
      const curPt   = trailCurve.getPoint(p);
      const aheadPt = trailCurve.getPoint(Math.min(1, p + 0.018));
      charGroup.position.copy(curPt);
      charGroup.lookAt(aheadPt.x, curPt.y, aheadPt.z);

      // Breath timer
      st.breathTimer += 0.016;
      if (st.breathTimer > 3.6) { st.breathTimer = 0; spawnBreath(); }

      // Update breath puffs
      for (let i = st.breathPuffs.length - 1; i >= 0; i--) {
        const pf = st.breathPuffs[i];
        pf.life += 0.016;
        pf.mesh.position.add(pf.vel);
        pf.mesh.scale.addScalar(0.012);
        (pf.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - pf.life / pf.maxLife) * 0.4);
        if (pf.life >= pf.maxLife) { scene.remove(pf.mesh); st.breathPuffs.splice(i, 1); }
      }

      // Animation
      if (isMoving) {
        st.walkPhase += speed * 4.5 + 0.07;
        const ph = st.walkPhase;
        leftLeg.rotation.x  =  Math.sin(ph) * 0.75;
        rightLeg.rotation.x = -Math.sin(ph) * 0.75;
        leftArm.rotation.x  = -Math.sin(ph) * 0.62;
        rightArm.rotation.x =  Math.sin(ph) * 0.52;
        torso.position.y = 1.1 + Math.abs(Math.sin(ph)) * 0.06;
        hood.position.y  = 1.66 + Math.abs(Math.sin(ph)) * 0.06;
        pack.position.y  = 1.18 + Math.abs(Math.sin(ph)) * 0.07;
        charGroup.rotation.z = Math.sin(ph) * 0.036;
        charGroup.rotation.x = 0.08;
        charLantern.position.x = 0.24 + Math.sin(ph * 1.6) * 0.055;

        if (Math.abs(Math.sin(st.walkPhase)) > 0.93 && t - lastStepTime > 0.26) {
          lastStepTime = t;
          audioEngine.playFootstep();
          const off = new THREE.Vector3(Math.sin(st.walkPhase) > 0 ? -0.18 : 0.18, 0, 0)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), charGroup.rotation.y);
          spawnFootstep(curPt.clone().add(off), charGroup.rotation.y);
        }
      } else {
        // Idle
        const br = Math.sin(t * 2.2) * 0.03;
        torso.scale.set(1 + br, 1 + br * 0.5, 1 + br);
        const ws = Math.sin(t * 0.75) * 0.05;
        leftLeg.rotation.z  =  ws * 0.6;
        rightLeg.rotation.z = -ws * 0.6;
        leftLeg.rotation.x  =  0.06;
        rightLeg.rotation.x = -0.06;
        hood.rotation.y = Math.sin(t * 0.42) * 0.24;
        hood.rotation.x = -0.06 + Math.cos(t * 0.48) * 0.08;
        leftArm.rotation.x  = THREE.MathUtils.lerp(leftArm.rotation.x,   0.06, 0.1);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.08, 0.1);
        charGroup.rotation.z = THREE.MathUtils.lerp(charGroup.rotation.z, 0, 0.1);
        charGroup.rotation.x = THREE.MathUtils.lerp(charGroup.rotation.x, 0.02, 0.1);
        charLantern.position.x = 0.24 + Math.sin(t * 2.8) * 0.028;
      }

      // ── CAMERA — Monoio split: explorer on RIGHT, void on LEFT ──
      const isMobile = window.innerWidth < 768;
      // camSideOffset: negative = camera shifts left = character appears on right of screen
      const camSideOffset = isMobile ? 0.1 : -1.55;
      const camDist = isMobile ? 4.0 : 4.8;
      const camH    = isMobile ? 1.8  : 2.0;

      const tang = trailCurve.getTangent(p);
      const norm = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const targetCamPos = curPt.clone()
        .sub(tang.clone().multiplyScalar(camDist))
        .add(norm.clone().multiplyScalar(camSideOffset));
      targetCamPos.y += camH;
      camera.position.lerp(targetCamPos, 0.09);
      const lookAt = curPt.clone().add(tang.clone().multiplyScalar(7)).add(new THREE.Vector3(0, 1.5, 0));
      camera.lookAt(lookAt);

      // Blizzard drift
      const bPosArr = blizzardGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < blizzardCount; i++) {
        bPosArr[i * 3]     += bVel[i * 3];
        bPosArr[i * 3 + 1] += bVel[i * 3 + 1];
        bPosArr[i * 3 + 2] += bVel[i * 3 + 2];
        if (bPosArr[i * 3 + 1] < camera.position.y - 7) {
          bPosArr[i * 3 + 1] = camera.position.y + 25;
          bPosArr[i * 3]     = camera.position.x + (Math.random() - 0.5) * 70;
          bPosArr[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 70;
        }
      }
      blizzardGeo.attributes.position.needsUpdate = true;

      // Shooting stars
      st.shootingStars.forEach(s => {
        if (!s.active && Math.random() < 0.004) {
          s.active = true; s.progress = 0;
          s.start.set(
            camera.position.x + (Math.random() - 0.5) * 95,
            camera.position.y + 38 + Math.random() * 30,
            camera.position.z - 50 - Math.random() * 60
          );
          s.dir.set(-1.3 - Math.random() * 0.8, -0.65 - Math.random() * 0.4, 0.3).normalize();
          s.speed = 0.025 + Math.random() * 0.02;
          s.tail.visible = true; s.head.visible = true;
        }
        if (s.active) {
          s.progress += s.speed;
          const hPos = s.start.clone().addScaledVector(s.dir, s.progress * 52);
          const tPos = s.start.clone().addScaledVector(s.dir, Math.max(0, s.progress * 52 - 10));
          s.head.position.copy(hPos);
          const pa = s.tail.geometry.attributes.position.array as Float32Array;
          tPos.toArray(pa, 0); hPos.toArray(pa, 3);
          s.tail.geometry.attributes.position.needsUpdate = true;
          if (s.progress >= 1) { s.active = false; s.tail.visible = false; s.head.visible = false; }
        }
      });

      // Checkpoint prop animations
      crystal.rotation.y += 0.04;
      crystal.rotation.x = Math.sin(t * 1.7) * 0.25;
      campfireLight.intensity = 5.5 + Math.sin(t * 14) * 1.8;
      beacon.rotation.y += 0.025;

      // Aurora glow pulse
      auroraGreen.intensity = 4.5 + Math.sin(t * 0.8) * 1.0;
      auroraCyan.intensity  = 3.0 + Math.sin(t * 0.6 + 1.0) * 0.8;

      // Moon halo gentle rotation
      moonGroup.children.forEach((c, i) => { if (i > 0) c.rotation.z += 0.0004 * (i === 1 ? 1 : -0.7); });

      // Checkpoint triggers
      [{ id: 1, p: 0.25 }, { id: 2, p: 0.55 }, { id: 3, 0.8: 0 }, { id: 4, p: 1.0 }];
      [{ id: 1, p: 0.25 }, { id: 2, p: 0.55 }, { id: 3, p: 0.8 }, { id: 4, p: 1.0 }].forEach(({ id, p: cp }) => {
        if (Math.abs(p - cp) < 0.048 && st.lastArrivedCheckpoint !== id) {
          st.lastArrivedCheckpoint = id;
          audioEngine.playCheckpointArrive();
          onCheckpointTrigger?.(id);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [onCheckpointTrigger]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full z-0"
      style={{ background: '#01030a' }}
    />
  );
};
