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
    isScrolling: false,
    stars: [] as { x: number; y: number; size: number; alpha: number; twinkleSpeed: number; color: string }[],
    shootingStars: [] as { x: number; y: number; len: number; speed: number; angle: number; alpha: number; active: boolean }[],
    ripples: [] as { x: number; y: number; r: number; maxR: number; alpha: number }[],
    lastCheckpoint: -1,
    lastStepTime: 0,
    breathTime: 0,
  });

  useEffect(() => {
    stateRef.current.targetProgress = scrollProgress;
    stateRef.current.isScrolling = isScrolling;
  }, [scrollProgress, isScrolling]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize celestial stars
    const initStars = () => {
      const count = Math.floor((width * height) / 3200);
      const stars = [];
      const colors = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#e9d5ff'];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.72),
          size: Math.random() * 1.5 + 0.4,
          alpha: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      stateRef.current.stars = stars;

      // Shooting stars
      const shooting = [];
      for (let i = 0; i < 3; i++) {
        shooting.push({
          x: 0,
          y: 0,
          len: 120,
          speed: 18,
          angle: Math.PI / 4,
          alpha: 0,
          active: false,
        });
      }
      stateRef.current.shootingStars = shooting;
    };

    initStars();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener('resize', handleResize);

    // --- RENDER LOOP ---
    const render = () => {
      const state = stateRef.current;
      state.time += 0.015;
      const t = state.time;

      // Smooth scroll lerp
      const delta = state.targetProgress - state.scrollProgress;
      state.scrollProgress += delta * 0.085;
      const p = Math.max(0, Math.min(1, state.scrollProgress));

      ctx.clearRect(0, 0, width, height);

      const waterHorizonY = height * 0.68 + p * 30;

      // ==========================================
      // 1. DEEP CINEMATIC SPACE SKY
      // ==========================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, waterHorizonY);
      skyGrad.addColorStop(0, '#02040a');
      skyGrad.addColorStop(0.5, '#050914');
      skyGrad.addColorStop(0.85, '#071224');
      skyGrad.addColorStop(1, '#0b1d38');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, waterHorizonY);

      // ==========================================
      // 2. CELESTIAL STARS & MILKY WAY NEBULA
      // ==========================================
      state.stars.forEach((star) => {
        star.alpha += Math.sin(t * 3.0 + star.x) * star.twinkleSpeed;
        const a = Math.max(0.1, Math.min(1, star.alpha));
        ctx.fillStyle = star.color;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(star.x, star.y - p * 40, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // ==========================================
      // 3. PHOTOREALISTIC MOON WITH VOLUMETRIC CORONA
      // ==========================================
      const moonX = width * 0.28 - p * 60;
      const moonY = height * 0.24 - p * 30;
      const moonR = Math.min(42, width * 0.038);

      // Outer Corona Glow
      const coronaGrad = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3.8);
      coronaGrad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
      coronaGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.15)');
      coronaGrad.addColorStop(1, 'rgba(7, 18, 36, 0)');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Moon Disc
      const moonDiscGrad = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
      moonDiscGrad.addColorStop(0, '#ffffff');
      moonDiscGrad.addColorStop(0.7, '#e2e8f0');
      moonDiscGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = moonDiscGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 4. MONOIO SURGING RIGHT-SIDE AURORA BOREALIS
      // ==========================================
      // Layered volumetric wave curtains tearing across the right side of the sky
      const drawAuroraCurtain = (
        baseX: number,
        baseY: number,
        waveFreq: number,
        waveSpeed: number,
        waveAmp: number,
        colorTop: string,
        colorMid: string,
        colorBot: string,
        alpha: number
      ) => {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha;

        const points = 32;
        const curtainWidth = width * 0.7;
        const startX = width - curtainWidth * 0.95;

        // Draw vertical striated ray curtains
        for (let i = 0; i < points; i++) {
          const x = startX + (i / points) * curtainWidth;
          const nx = i / points;

          // Wave height calculation
          const wave =
            Math.sin(nx * waveFreq + t * waveSpeed) * waveAmp +
            Math.cos(nx * (waveFreq * 1.6) - t * (waveSpeed * 0.8)) * (waveAmp * 0.5);

          const yTop = baseY + wave - 140;
          const yBot = waterHorizonY - 10 + wave * 0.3;

          const rayGrad = ctx.createLinearGradient(x, yTop, x, yBot);
          rayGrad.addColorStop(0, 'rgba(0,0,0,0)');
          rayGrad.addColorStop(0.2, colorTop);
          rayGrad.addColorStop(0.55, colorMid);
          rayGrad.addColorStop(0.9, colorBot);
          rayGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.rect(x - (curtainWidth / points) * 0.8, yTop, (curtainWidth / points) * 1.6, yBot - yTop);
          ctx.fill();
        }

        ctx.restore();
      };

      // 4A. Primary Intense Emerald Ribbon
      drawAuroraCurtain(
        width * 0.75,
        height * 0.18 - p * 20,
        5.2,
        0.8,
        45,
        'rgba(168, 85, 247, 0.65)',  // Violet crown
        'rgba(0, 229, 255, 0.85)',   // Glacial cyan
        'rgba(0, 255, 157, 0.95)',   // Intense emerald green
        0.85
      );

      // 4B. Secondary Flowing Cyan / Teal Ribbon
      drawAuroraCurtain(
        width * 0.65,
        height * 0.24 - p * 15,
        4.1,
        0.6,
        38,
        'rgba(244, 63, 94, 0.45)',   // Rose fringe
        'rgba(56, 189, 248, 0.75)',  // Cyan
        'rgba(5, 255, 161, 0.85)',   // Emerald
        0.7
      );

      // 4C. High Astral Violet Ribbon
      drawAuroraCurtain(
        width * 0.82,
        height * 0.12 - p * 25,
        6.5,
        1.0,
        50,
        'rgba(192, 132, 252, 0.55)',
        'rgba(139, 92, 246, 0.65)',
        'rgba(0, 240, 255, 0.6)',
        0.6
      );

      // ==========================================
      // 5. DISTANT GLACIATED MOUNTAIN SILHOUETTE
      // ==========================================
      const drawMountains = () => {
        ctx.fillStyle = '#060d1a';
        ctx.beginPath();
        ctx.moveTo(0, waterHorizonY);

        const mPoints = [
          { x: 0, y: waterHorizonY - 60 },
          { x: width * 0.15, y: waterHorizonY - 140 },
          { x: width * 0.28, y: waterHorizonY - 90 },
          { x: width * 0.45, y: waterHorizonY - 210 }, // Central peak
          { x: width * 0.6, y: waterHorizonY - 120 },
          { x: width * 0.78, y: waterHorizonY - 170 },
          { x: width * 0.92, y: waterHorizonY - 110 },
          { x: width, y: waterHorizonY - 70 },
        ];

        ctx.lineTo(mPoints[0].x, mPoints[0].y);
        for (let i = 1; i < mPoints.length; i++) {
          ctx.lineTo(mPoints[i].x, mPoints[i].y - p * 25);
        }
        ctx.lineTo(width, waterHorizonY);
        ctx.closePath();
        ctx.fill();

        // Mountain Snow Highlight Glints
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < mPoints.length; i++) {
          if (i === 0) ctx.moveTo(mPoints[i].x, mPoints[i].y - p * 25);
          else ctx.lineTo(mPoints[i].x, mPoints[i].y - p * 25);
        }
        ctx.stroke();
      };
      drawMountains();

      // ==========================================
      // 6. REFLECTIVE GLACIAL MIRROR WATER (MONOIO LAKE)
      // ==========================================
      const waterGrad = ctx.createLinearGradient(0, waterHorizonY, 0, height);
      waterGrad.addColorStop(0, '#040914');
      waterGrad.addColorStop(0.3, '#03070f');
      waterGrad.addColorStop(0.7, '#02040a');
      waterGrad.addColorStop(1, '#010206');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterHorizonY, width, height - waterHorizonY);

      // 6A. Aurora Water Reflection (Vertical Mirror Bloom)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const reflectGrad = ctx.createRadialGradient(
        width * 0.78,
        waterHorizonY + 60,
        20,
        width * 0.78,
        waterHorizonY + 180,
        width * 0.45
      );
      reflectGrad.addColorStop(0, 'rgba(0, 255, 157, 0.45)');
      reflectGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.25)');
      reflectGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.12)');
      reflectGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = reflectGrad;
      ctx.fillRect(0, waterHorizonY, width, height - waterHorizonY);

      // 6B. Moon Water Reflection Shimmer
      const moonReflectGrad = ctx.createLinearGradient(moonX, waterHorizonY, moonX, height);
      moonReflectGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      moonReflectGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.18)');
      moonReflectGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonReflectGrad;
      ctx.fillRect(moonX - 25, waterHorizonY, 50, height - waterHorizonY);

      // Water Ripple Waves
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let y = waterHorizonY + 10; y < height; y += 14) {
        const waveOffset = Math.sin(y * 0.1 + t * 2.0) * 12;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + waveOffset * 0.3);
        ctx.stroke();
      }
      ctx.restore();

      // ==========================================
      // 7. SOLITARY EXPLORER ON REFLECTIVE WATER (MONOIO FIGURE)
      // ==========================================
      // Positioned on the RIGHT side standing upon the reflective water
      const explorerBaseX = width * 0.82 - p * 35;
      const explorerBaseY = waterHorizonY + 75 + p * 15;
      const scale = Math.min(1.2, Math.max(0.85, width / 1200));

      const isMoving = Math.abs(delta) > 0.001;
      const walkCycle = isMoving ? Math.sin(t * 8.0) : 0;
      const breathCycle = Math.sin(t * 2.2) * 2;

      ctx.save();
      ctx.translate(explorerBaseX, explorerBaseY);
      ctx.scale(scale, scale);

      // 7A. Water Cast Reflection (Silhouette Mirror)
      ctx.save();
      ctx.scale(1, -0.65);
      ctx.globalAlpha = 0.28;
      ctx.filter = 'blur(3px)';
      ctx.fillStyle = '#02050b';
      // Reflected Torso & Head
      ctx.beginPath();
      ctx.ellipse(0, 45, 18, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 95, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 7B. Explorer Character Mesh Silhouette & Shading (Facing away towards Aurora)
      // Legs
      ctx.fillStyle = '#0c1626';
      // Left leg
      ctx.beginPath();
      ctx.roundRect(-14 + walkCycle * 4, -48, 11, 48, 4);
      ctx.fill();
      // Right leg
      ctx.beginPath();
      ctx.roundRect(3 - walkCycle * 4, -48, 11, 48, 4);
      ctx.fill();

      // Boots
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-16 + walkCycle * 4, -8, 15, 9, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(1 - walkCycle * 4, -8, 15, 9, 3);
      ctx.fill();

      // Torso / Heavy Parka
      ctx.fillStyle = '#0f1f38';
      ctx.beginPath();
      ctx.roundRect(-20, -105 + breathCycle, 40, 60, [10, 10, 4, 4]);
      ctx.fill();

      // Quilted Baffle Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;
      for (let py = -95; py <= -55; py += 12) {
        ctx.beginPath();
        ctx.moveTo(-18, py + breathCycle);
        ctx.lineTo(18, py + breathCycle);
        ctx.stroke();
      }

      // Expedition Backpack (facing camera)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-16, -98 + breathCycle, 32, 45, 6);
      ctx.fill();

      // Bedroll on top
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.roundRect(-18, -112 + breathCycle, 36, 12, 5);
      ctx.fill();

      // Hanging Lantern on backpack (glowing cyan point)
      const lanternY = -70 + breathCycle;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(14, lanternY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Lantern Light Glow
      const lanternGlow = ctx.createRadialGradient(14, lanternY, 2, 14, lanternY, 28);
      lanternGlow.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
      lanternGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(14, lanternY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Arctic Fur Ruff & Hood
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(0, -110 + breathCycle, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head / Hood
      ctx.fillStyle = '#0f1f38';
      ctx.beginPath();
      ctx.arc(0, -122 + breathCycle, 15, 0, Math.PI * 2);
      ctx.fill();

      // Snow Goggles on back of hood
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(-10, -126 + breathCycle, 20, 6, 2);
      ctx.fill();

      // Trekking Pole in Right Hand
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(26, -90 + breathCycle);
      ctx.lineTo(32, 2);
      ctx.stroke();

      // Aurora Rim Light Glow on Explorer (Right-side highlight)
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(12, -120 + breathCycle, 6, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.restore();

      // ==========================================
      // 8. CHECKPOINT TRIGGERS & AUDIO
      // ==========================================
      const checkpoints = [
        { id: 1, p: 0.25 },
        { id: 2, p: 0.55 },
        { id: 3, p: 0.80 },
        { id: 4, p: 1.00 },
      ];

      checkpoints.forEach(({ id, p: cpP }) => {
        if (Math.abs(p - cpP) < 0.045 && state.lastCheckpoint !== id) {
          state.lastCheckpoint = id;
          audioEngine.playCheckpointArrive();
          if (onCheckpointTrigger) onCheckpointTrigger(id);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
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
