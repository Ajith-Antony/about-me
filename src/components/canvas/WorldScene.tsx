import React, { useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    scrollProgress: 0,
    targetProgress: 0,
    isScrolling: false,
    time: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    lastCheckpoint: -1,
    lastStepTime: 0,
    snowParticles: [] as {
      x: number;
      y: number;
      z: number;
      size: number;
      alpha: number;
      vx: number;
      vy: number;
      twinkle: number;
    }[],
    shootingStars: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      len: number;
      alpha: number;
      active: boolean;
      life: number;
      maxLife: number;
    }[],
    ripples: [] as {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
    }[],
  });

  // Keep progress synced
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

    // Initialize 3D blizzard snow particles
    const initParticles = () => {
      const count = Math.min(1400, Math.floor((width * height) / 1200));
      const particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 0.9 + 0.1, // depth factor [0.1, 1.0]
          size: Math.random() * 2.2 + 0.6,
          alpha: Math.random() * 0.6 + 0.25,
          vx: -(Math.random() * 0.8 + 0.4), // wind to left
          vy: Math.random() * 0.6 + 0.3,   // falling
          twinkle: Math.random() * Math.PI * 2,
        });
      }
      stateRef.current.snowParticles = particles;

      // Shooting stars pool
      const shooters = [];
      for (let i = 0; i < 4; i++) {
        shooters.push({
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          len: 120,
          alpha: 0,
          active: false,
          life: 0,
          maxLife: 60,
        });
      }
      stateRef.current.shootingStars = shooters;
    };

    initParticles();

    // Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener('resize', handleResize);

    // Mouse movement for 3D parallax tracking
    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      stateRef.current.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Click on water to spawn ripple
    const handlePointerDown = (e: MouseEvent) => {
      if (e.clientY > height * 0.58) {
        stateRef.current.ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 4,
          maxRadius: 160,
          alpha: 0.7,
        });
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);

    // --- ANIMATION LOOP ---
    const render = () => {
      const state = stateRef.current;
      state.time += 0.016;
      const t = state.time;

      // Smooth scroll lerp
      const dScroll = state.targetProgress - state.scrollProgress;
      state.scrollProgress += dScroll * 0.085;
      const p = Math.max(0, Math.min(1, state.scrollProgress));

      // Footstep sound triggering while scrolling
      const isMoving = Math.abs(dScroll) > 0.0015;
      if (isMoving && t - state.lastStepTime > 0.28) {
        state.lastStepTime = t;
        audioEngine.playFootstep();
      }

      // Smooth mouse parallax lerp
      state.mouseX += (state.targetMouseX - state.mouseX) * 0.05;
      state.mouseY += (state.targetMouseY - state.mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // =========================================================================
      // 1. DYNAMIC SHIMMERING AURORA OVERLAY SHADER (UPPER RIGHT REGION)
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const drawAuroraWave = (
        startYFrac: number,
        freq: number,
        amp: number,
        speed: number,
        colorTop: string,
        colorMid: string,
        colorBot: string,
        baseAlpha: number
      ) => {
        const curtainX = width * 0.52;
        const curtainW = width * 0.48;
        const baseY = height * startYFrac - p * 30;
        const waveY = Math.sin(t * speed) * amp + Math.cos(t * speed * 0.7) * (amp * 0.4);

        const grad = ctx.createLinearGradient(curtainX, baseY + waveY - 80, curtainX + curtainW * 0.5, baseY + waveY + 220);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.2, colorTop);
        grad.addColorStop(0.55, colorMid);
        grad.addColorStop(0.85, colorBot);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.globalAlpha = baseAlpha * (0.8 + Math.sin(t * 1.5 + freq) * 0.2);

        ctx.beginPath();
        ctx.moveTo(curtainX, baseY + waveY - 60);

        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const x = curtainX + u * curtainW;
          const ripple = Math.sin(u * 8.0 + t * 2.2) * 26 + Math.cos(u * 14.0 - t * 1.8) * 12;
          const y = baseY + waveY + ripple;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, baseY + waveY + 300);
        ctx.lineTo(curtainX, baseY + waveY + 300);
        ctx.closePath();
        ctx.fill();
      };

      // Emerald Core Shimmer
      drawAuroraWave(
        0.10,
        3.2,
        28,
        0.9,
        'rgba(168, 85, 247, 0.45)', // violet fringe
        'rgba(0, 255, 157, 0.75)',  // luminous emerald
        'rgba(0, 240, 255, 0.65)',  // glacial cyan
        0.45
      );

      // Cyan / Blue Secondary Ribbon
      drawAuroraWave(
        0.16,
        4.5,
        22,
        0.65,
        'rgba(236, 72, 153, 0.35)', // rose crown
        'rgba(56, 189, 248, 0.7)',   // cyan
        'rgba(16, 185, 129, 0.6)',  // emerald
        0.38
      );

      ctx.restore();

      // =========================================================================
      // 2. INTERACTIVE WATER REFLECTION RIPPLES & SHIMMER (LOWER LAKE REGION)
      // =========================================================================
      const horizonY = height * 0.58 + p * 20;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Aurora water reflection bloom
      const reflectX = width * 0.68;
      const reflectY = horizonY + 80;
      const reflectRadius = width * 0.38;
      const reflectGrad = ctx.createRadialGradient(reflectX, reflectY, 10, reflectX, reflectY + 120, reflectRadius);
      reflectGrad.addColorStop(0, 'rgba(0, 255, 157, 0.32)');
      reflectGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.18)');
      reflectGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.08)');
      reflectGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = reflectGrad;
      ctx.globalAlpha = 0.85 + Math.sin(t * 1.8) * 0.15;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Water Ripple Waves
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1.2;
      for (let y = horizonY + 15; y < height; y += 18) {
        const wave = Math.sin(y * 0.08 + t * 2.0) * 14;
        const waveScale = (y - horizonY) / (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(
          width * 0.3, y + wave * waveScale,
          width * 0.7, y - wave * waveScale,
          width, y
        );
        ctx.stroke();
      }

      // User Pointer Interactive Ripples
      for (let i = state.ripples.length - 1; i >= 0; i--) {
        const rp = state.ripples[i];
        rp.radius += 1.8;
        rp.alpha -= 0.012;

        ctx.strokeStyle = `rgba(0, 255, 157, ${Math.max(0, rp.alpha)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.radius * 1.8, rp.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (rp.alpha <= 0 || rp.radius >= rp.maxRadius) {
          state.ripples.splice(i, 1);
        }
      }

      ctx.restore();

      // =========================================================================
      // 3. SHOOTING STARS ENGINE (UPPER LEFT CELESTIAL SKY)
      // =========================================================================
      if (Math.random() < 0.007) {
        const idleShooter = state.shootingStars.find((s) => !s.active);
        if (idleShooter) {
          idleShooter.x = width * (0.05 + Math.random() * 0.45);
          idleShooter.y = height * (0.04 + Math.random() * 0.22);
          const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35;
          const speed = 14 + Math.random() * 10;
          idleShooter.vx = Math.cos(angle) * speed;
          idleShooter.vy = Math.sin(angle) * speed;
          idleShooter.len = 90 + Math.random() * 80;
          idleShooter.alpha = 1.0;
          idleShooter.life = 0;
          idleShooter.maxLife = 45;
          idleShooter.active = true;
        }
      }

      state.shootingStars.forEach((s) => {
        if (!s.active) return;
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const progress = s.life / s.maxLife;
        s.alpha = progress < 0.2 ? progress / 0.2 : (1 - progress);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.max(0, s.alpha);

        const grad = ctx.createLinearGradient(
          s.x - s.vx * 4.5,
          s.y - s.vy * 4.5,
          s.x,
          s.y
        );
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.6, 'rgba(186,230,253,0.75)');
        grad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 4.0, s.y - s.vy * 4.0);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Star head glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (s.life >= s.maxLife) {
          s.active = false;
        }
      });

      // =========================================================================
      // 4. 3D BLIZZARD SNOW & ICE CRYSTAL DRIFT ENGINE
      // =========================================================================
      ctx.save();
      state.snowParticles.forEach((sp) => {
        // Wind drift + depth perspective
        sp.x += sp.vx * sp.z * 1.6 + state.mouseX * 0.4;
        sp.y += sp.vy * sp.z * 1.5;

        // Wrap around
        if (sp.x < -10) sp.x = width + 10;
        if (sp.x > width + 10) sp.x = -10;
        if (sp.y > height + 10) {
          sp.y = -10;
          sp.x = Math.random() * width;
        }

        // Twinkle
        sp.twinkle += 0.04;
        const alpha = Math.max(0.1, sp.alpha + Math.sin(sp.twinkle) * 0.2);

        ctx.fillStyle = sp.z > 0.6 ? '#ffffff' : '#bae6fd';
        ctx.globalAlpha = alpha * sp.z;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * sp.z, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // =========================================================================
      // 5. CHECKPOINT TRIGGERS & AUDIO SONAR
      // =========================================================================
      const checkpoints = [
        { id: 1, p: 0.25 },
        { id: 2, p: 0.55 },
        { id: 3, p: 0.80 },
        { id: 4, p: 1.00 },
      ];

      checkpoints.forEach(({ id, p: cpP }) => {
        if (Math.abs(p - cpP) < 0.048 && state.lastCheckpoint !== id) {
          state.lastCheckpoint = id;
          audioEngine.playCheckpointArrive();
          if (onCheckpointTrigger) {
            onCheckpointTrigger(id);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animId);
    };
  }, [onCheckpointTrigger]);

  // Dynamic 3D mouse parallax transform
  const mouseX = stateRef.current.mouseX;
  const mouseY = stateRef.current.mouseY;

  // Crossfade between Arctic Lake (Hero & CP 1-3) and Summit Zenith (CP 4)
  const summitOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.24));
  const baseScale = 1.02 + scrollProgress * 0.06;

  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-auto bg-[#01030a]"
      style={{ perspective: '1200px' }}
    >
      {/* 3D Parallax Container for Cinematic Art Base */}
      <div
        className="absolute inset-[-4%] w-[108%] h-[108%] transition-transform duration-200 ease-out"
        style={{
          transform: `scale(${baseScale}) translate3d(${mouseX * -14}px, ${mouseY * -10}px, 0) rotateX(${mouseY * 0.75}deg) rotateY(${mouseX * -0.75}deg)`,
        }}
      >
        {/* Layer 1: Photorealistic Arctic Lake Base Plate (Monoio Aesthetic) */}
        <img
          src={`${baseUrl}monoio_arctic_aurora.jpg`}
          alt="Nordic Arctic Aurora Expedition"
          className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.05] brightness-[0.98]"
          loading="eager"
        />

        {/* Layer 2: Summit Apex Zenith Base Plate (Crossfades near 100%) */}
        <img
          src={`${baseUrl}monoio_summit_beacon.jpg`}
          alt="Arctic Summit Beacon Zenith"
          className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.05] brightness-[0.98] transition-opacity duration-700 ease-in-out"
          style={{ opacity: summitOpacity }}
          loading="eager"
        />

        {/* Ambient Dark Gradient Vignette for Readability on Left Side */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#01030a]/85 via-[#01030a]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#01030a]/60 via-transparent to-[#01030a]/90 pointer-events-none" />
      </div>

      {/* Real-time Dynamic WebGL/Canvas Atmospheric & Ripple Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
    </div>
  );
};
