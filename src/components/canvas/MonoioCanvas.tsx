import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../audio/AudioEngine';

interface MonoioCanvasProps {
  scrollProgress: number;
  isScrolling: boolean;
  onCheckpointTrigger?: (checkpointId: number) => void;
}

export const MonoioCanvas: React.FC<MonoioCanvasProps> = ({
  scrollProgress,
  isScrolling,
  onCheckpointTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    time: 0,
    scrollProgress: 0,
    targetProgress: 0,
    lastCheckpoint: -1,
    stars: [] as {
      x: number; y: number; size: number; alpha: number;
      twinklePhase: number; twinkleSpeed: number; color: string;
    }[],
    shooters: [] as {
      x: number; y: number; vx: number; vy: number; len: number; life: number; maxLife: number; active: boolean;
    }[],
  });

  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    // ---- INIT STARS ----
    const initStars = () => {
      const n = Math.round((W * H) / 2800);
      const palettes = [
        ['#bfdbfe', '#eff6ff'],  // cool blue-white
        ['#fef08a', '#fde68a'],  // amber
        ['#e9d5ff', '#f3e8ff'],  // violet
        ['#ffffff', '#f0fdf4'],  // pure white / mint
      ];
      stateRef.current.stars = Array.from({ length: n }, () => {
        const pal = palettes[Math.floor(Math.random() * palettes.length)];
        return {
          x: Math.random() * W,
          y: Math.random() * H * 0.65,
          size: Math.random() * 1.6 + 0.3,
          alpha: Math.random() * 0.6 + 0.4,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.03 + 0.008,
          color: pal[Math.floor(Math.random() * pal.length)],
        };
      });

      stateRef.current.shooters = Array.from({ length: 4 }, () => ({
        x: 0, y: 0, vx: 0, vy: 0, len: 0,
        life: 999, maxLife: 999, active: false,
      }));
    };

    initStars();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener('resize', onResize);

    // ---- MAIN RENDER LOOP ----
    const render = () => {
      const st = stateRef.current;
      st.time += 0.016;
      const t = st.time;

      // Smooth scroll
      st.scrollProgress += (st.targetProgress - st.scrollProgress) * 0.09;
      const p = Math.min(1, Math.max(0, st.scrollProgress));

      ctx.clearRect(0, 0, W, H);

      /* ========================================================
         SKY — deep midnight gradient
      ======================================================== */
      const skyY = H * 0.62; // horizon line — sky above, water below
      const skyGrad = ctx.createLinearGradient(0, 0, 0, skyY);
      skyGrad.addColorStop(0,    '#010308');
      skyGrad.addColorStop(0.4,  '#02060f');
      skyGrad.addColorStop(0.75, '#040c1e');
      skyGrad.addColorStop(1,    '#071528');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, skyY);

      /* ========================================================
         STARS — twinkling field across the sky half
      ======================================================== */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      st.stars.forEach(s => {
        const a = s.alpha + Math.sin(t * s.twinkleSpeed * 60 + s.twinklePhase) * 0.3;
        ctx.globalAlpha = Math.max(0.05, Math.min(1, a));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      /* ========================================================
         SHOOTING STARS — occasional streaks
      ======================================================== */
      if (Math.random() < 0.005) {
        const idle = st.shooters.find(s => !s.active);
        if (idle) {
          idle.x = W * (0.3 + Math.random() * 0.6);
          idle.y = H * (0.02 + Math.random() * 0.2);
          const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
          const speed = 8 + Math.random() * 8;
          idle.vx = Math.cos(angle) * speed;
          idle.vy = Math.sin(angle) * speed;
          idle.len = 60 + Math.random() * 80;
          idle.life = 0;
          idle.maxLife = 60;
          idle.active = true;
        }
      }
      st.shooters.forEach(s => {
        if (!s.active) return;
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const frac = s.life / s.maxLife;
        const a = frac < 0.2 ? frac / 0.2 : frac > 0.7 ? (1 - frac) / 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        const grad = ctx.createLinearGradient(s.x - s.vx * 8, s.y - s.vy * 8, s.x, s.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(224,242,254,1)');
        ctx.strokeStyle = grad as unknown as string;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 6, s.y - s.vy * 6);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();
        if (s.life >= s.maxLife) s.active = false;
      });

      /* ========================================================
         MOON — large, bright, upper-left with layered corona
      ======================================================== */
      const moonX = W * 0.18;
      const moonY = H * 0.18 - p * 20;
      const moonR  = Math.max(28, Math.min(52, W * 0.04));

      // outer corona (3 layers)
      [[moonR * 5.5, 0.10], [moonR * 3.5, 0.22], [moonR * 2.1, 0.38]].forEach(([r, intensity]) => {
        const cg = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, r);
        cg.addColorStop(0, `rgba(186,230,253,${intensity})`);
        cg.addColorStop(0.5, `rgba(56,189,248,${(intensity as number) * 0.4})`);
        cg.addColorStop(1, 'rgba(7,18,36,0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(moonX, moonY, r as number, 0, Math.PI * 2);
        ctx.fill();
      });

      // moon disc — bright with limb darkening
      const mdg = ctx.createRadialGradient(
        moonX - moonR * 0.35, moonY - moonR * 0.35, moonR * 0.05,
        moonX, moonY, moonR
      );
      mdg.addColorStop(0,   '#ffffff');
      mdg.addColorStop(0.5, '#f0f9ff');
      mdg.addColorStop(0.85,'#cbd5e1');
      mdg.addColorStop(1,   '#64748b');
      ctx.fillStyle = mdg;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // lunar maria (dark blotches)
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#475569';
      [[moonX - moonR*0.2, moonY + moonR*0.1, moonR*0.28],
       [moonX + moonR*0.3, moonY - moonR*0.15, moonR*0.18],
       [moonX - moonR*0.4, moonY - moonR*0.3, moonR*0.15],
      ].forEach(([mx, my, mr]) => {
        ctx.beginPath();
        ctx.arc(mx as number, my as number, mr as number, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      /* ========================================================
         AURORA — surging across RIGHT side of screen
         Three layered curtains: emerald / cyan / violet
      ======================================================== */
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const drawCurtain = (
        startXFrac: number,   // 0..1 where curtain starts (x)
        widthFrac:  number,   // fraction of W
        baseYFrac:  number,   // fraction of H
        freqX:      number,
        freqT:      number,
        ampY:       number,
        rays:       number,
        topColor:   string,
        midColor:   string,
        botColor:   string,
        globalA:    number
      ) => {
        ctx.globalAlpha = globalA;
        const startX = W * startXFrac;
        const curtW  = W * widthFrac;
        const baseY  = H * baseYFrac;
        const rayW   = curtW / rays;

        for (let i = 0; i < rays; i++) {
          const nx = i / (rays - 1);
          const x  = startX + i * rayW;

          // wave displacement in Y
          const waveY =
            Math.sin(nx * freqX + t * freqT)             * ampY +
            Math.cos(nx * freqX * 1.7 - t * freqT * 0.6) * ampY * 0.42 +
            Math.sin(t * freqT * 1.3 + nx * 2.8)          * ampY * 0.22;

          const yTop = baseY + waveY - 20;
          const yBot = skyY  + waveY * 0.15 + 5;

          // per-ray opacity varies with curtain ripple
          const rayAlpha = 0.35 + Math.sin(nx * 8 + t * 2.5) * 0.2 + 0.15 * Math.sin(t * 1.8 + nx * 5);

          const rg = ctx.createLinearGradient(x, yTop, x, yBot);
          rg.addColorStop(0,    'rgba(0,0,0,0)');
          rg.addColorStop(0.08, topColor);
          rg.addColorStop(0.45, midColor);
          rg.addColorStop(0.88, botColor);
          rg.addColorStop(1,    'rgba(0,0,0,0)');

          ctx.fillStyle  = rg;
          ctx.globalAlpha = globalA * rayAlpha;
          ctx.fillRect(x - rayW * 0.6, yTop, rayW * 1.2, yBot - yTop);
        }
      };

      // PRIMARY — Intense emerald / right-heavy
      drawCurtain(
        0.3, 0.75,                // starts at 30% width, spans 75%
        0.06,                     // top of curtain at 6% height
        5.5, 0.7, H * 0.14,
        36,
        'rgba(168,85,247,0.7)',   // violet crown
        'rgba(0,230,160,0.9)',    // emerald core
        'rgba(0,200,255,0.75)',   // cyan hem
        0.9
      );

      // SECONDARY — Wider, slower, cyan/teal
      drawCurtain(
        0.22, 0.82,
        0.10,
        4.2, 0.5, H * 0.10,
        28,
        'rgba(244,63,94,0.4)',
        'rgba(34,211,238,0.7)',
        'rgba(16,185,129,0.8)',
        0.65
      );

      // TERTIARY — Narrow, high-frequency violet
      drawCurtain(
        0.55, 0.50,
        0.04,
        7.0, 1.1, H * 0.08,
        18,
        'rgba(192,132,252,0.6)',
        'rgba(139,92,246,0.55)',
        'rgba(56,189,248,0.5)',
        0.55
      );

      ctx.globalAlpha = 1;
      ctx.restore();

      /* ========================================================
         MOUNTAINS — distant silhouette above horizon
      ======================================================== */
      const drawMtns = (color: string, heightScale: number, shiftX: number) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, skyY);
        const peaks = [
          [0,       skyY - 80  * heightScale],
          [W*0.10,  skyY - 170 * heightScale],
          [W*0.20,  skyY - 120 * heightScale],
          [W*0.35,  skyY - 240 * heightScale],  // dominant peak
          [W*0.50,  skyY - 160 * heightScale],
          [W*0.65,  skyY - 200 * heightScale],
          [W*0.78,  skyY - 130 * heightScale],
          [W*0.90,  skyY - 175 * heightScale],
          [W,       skyY - 100 * heightScale],
        ];
        peaks.forEach(([x, y], idx) => {
          if (idx === 0) ctx.lineTo(x + shiftX, y);
          else {
            const prev = peaks[idx - 1];
            ctx.bezierCurveTo(
              prev[0] + shiftX + (x - prev[0]) * 0.5, prev[1],
              x + shiftX - (x - prev[0]) * 0.3, y,
              x + shiftX, y
            );
          }
        });
        ctx.lineTo(W, skyY);
        ctx.closePath();
        ctx.fill();
      };

      // Far range (lighter, taller)
      drawMtns('rgba(8,20,46,0.7)', 0.55, 15);
      // Mid range
      drawMtns('rgba(5,14,32,0.88)', 0.75, 0);
      // Near range (darkest)
      drawMtns('#030a18', 0.55, -10);

      // Snow glints on peaks
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      [[W*0.35, skyY - 240*0.75], [W*0.65, skyY - 200*0.75], [W*0.10, skyY - 170*0.75], [W*0.90, skyY-175*0.75]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo((x as number)-12, (y as number)+14);
        ctx.lineTo(x as number, y as number);
        ctx.lineTo((x as number)+12, (y as number)+14);
        ctx.stroke();
      });
      ctx.restore();

      /* ========================================================
         WATER — calm reflective glacial lake (lower 38% of canvas)
      ======================================================== */
      const waterGrad = ctx.createLinearGradient(0, skyY, 0, H);
      waterGrad.addColorStop(0,   '#030a18');
      waterGrad.addColorStop(0.15,'#020710');
      waterGrad.addColorStop(0.5, '#010408');
      waterGrad.addColorStop(1,   '#010205');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, skyY, W, H - skyY);

      // Horizon shore line
      ctx.fillStyle = '#04101f';
      ctx.fillRect(0, skyY - 2, W, 6);

      // Aurora reflection bloom on water
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const aBloom = ctx.createRadialGradient(W*0.72, skyY+40, 10, W*0.7, skyY+150, W*0.55);
      aBloom.addColorStop(0,   'rgba(0,220,140,0.5)');
      aBloom.addColorStop(0.35,'rgba(0,200,255,0.3)');
      aBloom.addColorStop(0.65,'rgba(139,92,246,0.15)');
      aBloom.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = aBloom;
      ctx.fillRect(0, skyY, W, H - skyY);

      // Moon reflection column
      const mRef = ctx.createLinearGradient(moonX, skyY, moonX, H);
      mRef.addColorStop(0,   'rgba(255,255,255,0.4)');
      mRef.addColorStop(0.2, 'rgba(186,230,253,0.2)');
      mRef.addColorStop(0.5, 'rgba(186,230,253,0.08)');
      mRef.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = mRef;
      ctx.fillRect(moonX - 30, skyY, 60, H - skyY);

      ctx.globalAlpha = 1;
      ctx.restore();

      // Water ripple lines
      ctx.save();
      ctx.globalAlpha = 0.06;
      for (let ry = skyY + 8; ry < H; ry += 11) {
        const rx = Math.sin(ry * 0.08 + t * 1.8) * 18;
        const w  = W * (0.4 + 0.6 * (1 - (ry - skyY) / (H - skyY)));
        const cx = W / 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - w/2 + rx, ry);
        ctx.lineTo(cx + w/2 + rx * 0.5, ry);
        ctx.stroke();
      }
      ctx.restore();

      /* ========================================================
         EXPLORER — solitary figure, right side, AT horizon line
         Standing ON the shore / water edge looking LEFT at aurora
      ======================================================== */
      const figScale  = Math.max(0.7, Math.min(1.4, W / 1280));
      const figH      = 160 * figScale;     // total figure height in px
      const figX      = W * 0.80;           // right side
      const figBottom = skyY + 8;           // feet right at horizon
      const figTop    = figBottom - figH;   // head y

      const breathY   = Math.sin(t * 2.1) * 2.5;
      const isWalking = Math.abs(st.targetProgress - st.scrollProgress) > 0.003;
      const walkCycle = isWalking ? Math.sin(t * 7.5) : 0;

      ctx.save();
      ctx.translate(figX, figBottom); // origin = feet

      // --- Water reflection (inverted, blurred, below horizon) ---
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.scale(1, -1); // flip vertically (y grows downward = reflected upward into water)
      ctx.filter = 'blur(2px)';
      // reflected body silhouette
      const refGrad = ctx.createLinearGradient(0, 0, 0, figH * 0.6);
      refGrad.addColorStop(0, 'rgba(0,20,40,0.95)');
      refGrad.addColorStop(1, 'rgba(0,20,40,0)');
      ctx.fillStyle = refGrad;
      ctx.beginPath();
      ctx.ellipse(0, figH * 0.3, 16 * figScale, figH * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- LEGS (feet at y=0, knees at ~-50*scale) ---
      const lw = 11 * figScale;
      const lh = 52 * figScale;
      const bh = 10 * figScale;

      // left leg
      ctx.fillStyle = '#0e1e38';
      ctx.beginPath();
      ctx.roundRect(-lw * 0.9 + walkCycle * 7 * figScale, -lh, lw, lh, 5);
      ctx.fill();
      // right leg
      ctx.beginPath();
      ctx.roundRect(lw * 0.1 - walkCycle * 7 * figScale, -lh, lw, lh, 5);
      ctx.fill();

      // boots
      ctx.fillStyle = '#1a2e4a';
      ctx.beginPath();
      ctx.roundRect(-lw * 0.9 + walkCycle * 7 * figScale - 2, -bh, lw + 5, bh, [3, 3, 0, 0]);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(lw * 0.1 - walkCycle * 7 * figScale - 2, -bh, lw + 5, bh, [3, 3, 0, 0]);
      ctx.fill();

      // --- TORSO / PARKA ---
      const tW = 42 * figScale;
      const tH = 64 * figScale;
      const tY = -(lh + tH) + breathY;

      ctx.fillStyle = '#0d1e36';
      ctx.beginPath();
      ctx.roundRect(-tW / 2, tY, tW, tH, [12 * figScale, 12 * figScale, 4, 4]);
      ctx.fill();

      // parka quilted baffles
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      for (let bi = 1; bi <= 4; bi++) {
        const by = tY + tH * (bi / 5);
        ctx.beginPath();
        ctx.moveTo(-tW / 2 + 3, by);
        ctx.lineTo(tW / 2 - 3,  by);
        ctx.stroke();
      }
      ctx.restore();

      // hood fur ruff
      ctx.fillStyle = '#c8d8e8';
      const hoodY = tY - 8 * figScale + breathY;
      ctx.beginPath();
      ctx.ellipse(2 * figScale, hoodY, 22 * figScale, 9 * figScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // head / hood
      const headR = 18 * figScale;
      const headY = hoodY - headR * 0.6;
      ctx.fillStyle = '#0d1e36';
      ctx.beginPath();
      ctx.arc(2 * figScale, headY, headR, 0, Math.PI * 2);
      ctx.fill();

      // goggles
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-headR * 0.6, headY - headR * 0.2, headR * 1.2, headR * 0.38, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- BACKPACK ---
      const bpW = 32 * figScale;
      const bpH = 48 * figScale;
      const bpX = tW / 2 - 2;
      const bpY = tY + 4 * figScale + breathY;
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.roundRect(bpX, bpY, bpW, bpH, 6);
      ctx.fill();

      // bedroll strapped on top
      ctx.fillStyle = '#0e7a70';
      ctx.beginPath();
      ctx.roundRect(bpX - 2, bpY - 10 * figScale, bpW + 4, 10 * figScale, 4);
      ctx.fill();

      // --- LANTERN hanging off backpack ---
      const lanX = bpX + bpW * 0.6;
      const lanY = bpY + bpH * 0.6 + Math.sin(t * 3.0) * 4 * figScale + breathY;
      const lanR = 5 * figScale;

      // string
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bpX + bpW * 0.5, bpY + bpH * 0.35 + breathY);
      ctx.lineTo(lanX, lanY);
      ctx.stroke();

      // lantern glow aura
      const lanGlow = ctx.createRadialGradient(lanX, lanY, 0, lanX, lanY, lanR * 6);
      lanGlow.addColorStop(0,   'rgba(56,189,248,0.6)');
      lanGlow.addColorStop(0.4, 'rgba(56,189,248,0.2)');
      lanGlow.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = lanGlow;
      ctx.beginPath();
      ctx.arc(lanX, lanY, lanR * 6, 0, Math.PI * 2);
      ctx.fill();

      // lantern body
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(lanX, lanY, lanR, 0, Math.PI * 2);
      ctx.fill();

      // --- ARMS ---
      const armW = 9 * figScale;
      const armH = 46 * figScale;
      const shoulderY = tY + 12 * figScale + breathY;

      // left arm (towards viewer's left — swings forward when walking)
      ctx.fillStyle = '#0d1e36';
      ctx.save();
      ctx.translate(-tW / 2 - armW * 0.4, shoulderY);
      ctx.rotate(-0.2 + walkCycle * 0.4);
      ctx.beginPath();
      ctx.roundRect(-armW / 2, 0, armW, armH, 5);
      ctx.fill();
      ctx.restore();

      // right arm (holds trekking pole)
      ctx.save();
      ctx.translate(tW / 2 + armW * 0.4, shoulderY);
      ctx.rotate(0.15 - walkCycle * 0.3);
      ctx.fillStyle = '#0d1e36';
      ctx.beginPath();
      ctx.roundRect(-armW / 2, 0, armW, armH, 5);
      ctx.fill();

      // trekking pole
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 2.5 * figScale;
      ctx.beginPath();
      ctx.moveTo(2 * figScale, armH * 0.6);
      ctx.lineTo(12 * figScale, armH + 55 * figScale);
      ctx.stroke();
      ctx.restore();

      // --- AURORA RIM LIGHT on figure (from the right = towards aurora) ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.35 + Math.sin(t * 1.2) * 0.1;
      const rimGrad = ctx.createLinearGradient(tW / 2, headY, tW / 2 + 20 * figScale, 0);
      rimGrad.addColorStop(0, 'rgba(0,255,157,0.55)');
      rimGrad.addColorStop(1, 'rgba(0,200,255,0)');
      ctx.strokeStyle = rimGrad as unknown as string;
      ctx.lineWidth = 2.5 * figScale;
      // right edge of head
      ctx.beginPath();
      ctx.arc(2 * figScale, headY, headR + 1, -Math.PI * 0.7, Math.PI * 0.4);
      ctx.stroke();
      // right edge of torso
      ctx.beginPath();
      ctx.moveTo(tW / 2 - 2, tY + tH * 0.1 + breathY);
      ctx.lineTo(tW / 2 - 2, tY + tH * 0.9 + breathY);
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // end figure translate

      /* ========================================================
         CHECKPOINT TRIGGERS
      ======================================================== */
      const cps = [{ id: 1, p: 0.25 }, { id: 2, p: 0.55 }, { id: 3, 0.80: 0 }, { id: 4, p: 1.0 }];
      [
        { id: 1, p: 0.25 },
        { id: 2, p: 0.55 },
        { id: 3, p: 0.80 },
        { id: 4, p: 1.00 },
      ].forEach(({ id, p: cp }) => {
        if (Math.abs(p - cp) < 0.05 && st.lastCheckpoint !== id) {
          st.lastCheckpoint = id;
          audioEngine.playCheckpointArrive();
          onCheckpointTrigger?.(id);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [onCheckpointTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
