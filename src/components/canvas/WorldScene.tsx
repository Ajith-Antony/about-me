import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [baseLoaded, setBaseLoaded] = useState<boolean>(false);
  const [summitLoaded, setSummitLoaded] = useState<boolean>(false);

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

  // Track mouse for 3D parallax tilt
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

  // Main Canvas Render Loop (Shaders, Blizzard Particles, Living Aurora & Ripples)
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
      const count = Math.min(320, Math.round((W * H) / 3600));
      stateRef.current.snow = Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * W * 1.6,
        y: (Math.random() - 0.5) * H * 1.6,
        z: Math.random() * 950 + 50, // 50 (near) to 1000 (far)
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
        const dollyScale = 1.0 + p * 0.26;
        const dollyY = p * -45;
        const dollyZ = p * 70;
        const tiltX = -st.currentMouseY * 3.2;
        const tiltY = st.currentMouseX * 4.5;
        const panX = st.currentMouseX * 18;
        const panY = st.currentMouseY * 12;

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
         1. LIVING GLSL AURORA WAVE RIBBONS (Upper Right Sky)
         Sinusoidal harmonics create living, undulating Northern Lights curtains
      ======================================================================== */
      // Only render aurora when baseplate is visible (p < 0.88)
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

            // Multi-frequency wave displacement
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

        // Primary Emerald Ribbon (intense upper right curtain)
        drawAuroraRibbon(
          0.38, 0.98,
          0.06,
          H * 0.08,
          4.8, 1.2,
          'rgba(168, 85, 247, 0.55)',   // Violet crown
          'rgba(52, 211, 153, 0.78)',   // Emerald core
          'rgba(56, 189, 248, 0.60)',   // Cyan lower hem
          0.72
        );

        // Secondary Glacial Cyan Ribbon (wider, fluid)
        drawAuroraRibbon(
          0.48, 1.02,
          0.12,
          H * 0.06,
          3.6, 0.85,
          'rgba(244, 63, 94, 0.30)',    // Subtle magenta edge
          'rgba(34, 211, 238, 0.70)',   // Glacial cyan core
          'rgba(16, 185, 129, 0.65)',   // Bright mint
          0.60
        );

        // Soft Aurora Reflection Bloom on the lower lake surface
        const bloomY = H * 0.62;
        const lakeBloom = ctx.createRadialGradient(
          W * 0.68, bloomY + 45, 15,
          W * 0.65, bloomY + 180, W * 0.45
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
         2. INTERACTIVE WATER RIPPLES (Lower 38% Mirror Lake)
         Reacts to cursor hover and scroll acceleration
      ======================================================================== */
      if (baseAlpha > 0.1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Add periodic scroll ripples if moving fast
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

        // Render expanding ripples
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
          // Flattened ellipse for perspective water plane
          ctx.ellipse(r.x, r.y, r.radius * 2.2, r.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Subtle ambient horizontal water glints
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 0.8;
        const waterTop = H * 0.62;
        for (let ry = waterTop + 15; ry < H; ry += 24) {
          const shiftX = Math.sin(ry * 0.05 + t * 1.6) * 16;
          const spanW = W * (0.5 + 0.5 * ((ry - waterTop) / (H - waterTop)));
          const cx = W * 0.65;
          ctx.beginPath();
          ctx.moveTo(cx - spanW * 0.4 + shiftX, ry);
          ctx.lineTo(cx + spanW * 0.4 + shiftX * 0.5, ry);
          ctx.stroke();
        }

        ctx.restore();
      }

      /* ========================================================================
         3. CELESTIAL SHOOTING STARS (Occasional Meteor Streaks)
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
         4. 3D BLIZZARD SNOW PARTICLES (The Motion Secret!)
         Velocity-responsive particles rush toward the camera on scroll,
         creating an unmistakable physical sensation of forward mountain travel!
      ======================================================================== */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const cx = W / 2;
      const cy = H / 2;
      // Scroll velocity acceleration multiplier
      const forwardVelocity = 1.0 + vel * 28.0;

      st.snow.forEach((p3d) => {
        // Update 3D coordinates
        p3d.z -= p3d.vz * forwardVelocity;
        p3d.x += p3d.vx + Math.sin(t * 1.2 + p3d.y * 0.01) * 0.6;
        p3d.y += p3d.vy;

        // Recycle particle when it passes behind the camera
        if (p3d.z <= 20) {
          p3d.z = 950 + Math.random() * 100;
          p3d.x = (Math.random() - 0.5) * W * 1.6;
          p3d.y = (Math.random() - 0.5) * H * 1.6;
        }
        if (p3d.y > H * 1.2) {
          p3d.y = -H * 0.2;
          p3d.x = (Math.random() - 0.5) * W * 1.6;
        }

        // Project 3D coordinate to 2D screen coordinates with perspective focal length
        const focalLength = 480;
        const scale = focalLength / p3d.z;
        const screenX = cx + p3d.x * scale;
        const screenY = cy + p3d.y * scale;

        // Skip off-screen particles
        if (screenX < -20 || screenX > W + 20 || screenY < -20 || screenY > H + 20) {
          return;
        }

        const radius = Math.max(0.4, p3d.size * scale);
        // Near particles fade in; extreme close particles fade out
        const depthAlpha =
          p3d.z < 80
            ? (p3d.z / 80) * p3d.alpha
            : Math.min(1, (1000 - p3d.z) / 450) * p3d.alpha;

        ctx.globalAlpha = depthAlpha * 0.85;

        // If scrolling fast, stretch snow into motion blur streaks!
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
         When summit plate is visible, pulse golden beacon light
      ======================================================================== */
      const summitAlpha = Math.min(1, Math.max(0, (p - 0.72) / 0.20));
      if (summitAlpha > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Beacon cairn is located near center-right summit ridge
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

  // Calculate plate opacities for the continuous elevation ascent
  const baseAlpha = Math.max(0, 1 - Math.max(0, (scrollProgress - 0.70) / 0.20));
  const summitAlpha = Math.min(1, Math.max(0, (scrollProgress - 0.72) / 0.20));

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden select-none pointer-events-none bg-[#01030a] z-0">
      
      {/* 3D PARALLAX & CAMERA DOLLY STAGE */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 1. BASEPLATE: 8K Photorealistic Nordic Arctic Aurora Lake & Explorer */}
        <div
          className="absolute inset-[-4%] w-[108%] h-[108%] transition-opacity duration-700"
          style={{
            opacity: baseAlpha,
          }}
        >
          <img
            src={`${baseUrl}monoio_arctic_aurora.jpg`}
            alt="Photorealistic Nordic Arctic Aurora Lake"
            className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
              baseLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setBaseLoaded(true)}
          />
          {/* Subtle natural contrast and cinematic vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#01030a]/80 via-transparent to-[#01030a]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(1,3,10,0.75)_100%)] pointer-events-none" />
        </div>

        {/* 2. SUMMIT PLATE: 8K Photorealistic Mountain Summit Apex Beacon */}
        <div
          className="absolute inset-[-4%] w-[108%] h-[108%] transition-opacity duration-700"
          style={{
            opacity: summitAlpha,
          }}
        >
          <img
            src={`${baseUrl}monoio_summit_beacon.jpg`}
            alt="Photorealistic Mountain Summit Beacon"
            className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
              summitLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setSummitLoaded(true)}
          />
          {/* Summit cinematic vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#01030a]/85 via-transparent to-[#01030a]/50 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(1,3,10,0.8)_100%)] pointer-events-none" />
        </div>
      </div>

      {/* 3. DYNAMIC ATMOSPHERIC SHADER & BLIZZARD CANVAS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 4. LEFT VOID SHADOW GRADIENT (Preserves 100% WCAG AAA readability for docked cards) */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-2/3 md:w-1/2 lg:w-5/12 bg-gradient-to-r from-[#01030a]/90 via-[#01030a]/50 to-transparent pointer-events-none z-10"
      />
    </div>
  );
};
