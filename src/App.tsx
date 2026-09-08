import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorldScene } from './components/canvas/WorldScene';
import { HeroOverlay } from './components/hud/HeroOverlay';
import { ScrollyContent } from './components/hud/ScrollyContent';
import { HUDControls } from './components/hud/HUDControls';
import { SkillsModal } from './components/hud/SkillsModal';
import { ExperienceQuestLog } from './components/hud/ExperienceQuestLog';
import { PhilosophyPanel } from './components/hud/PhilosophyPanel';
import { ContactTerminal } from './components/hud/ContactTerminal';
import { ResumeModal } from './components/hud/ResumeModal';
import { MessageModal } from './components/hud/MessageModal';
import { audioEngine } from './audio/AudioEngine';

export const App: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Detail Modal States
  const [skillsOpen, setSkillsOpen] = useState<boolean>(false);
  const [experienceOpen, setExperienceOpen] = useState<boolean>(false);
  const [philosophyOpen, setPhilosophyOpen] = useState<boolean>(false);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [resumeOpen, setResumeOpen] = useState<boolean>(false);
  const [messageOpen, setMessageOpen] = useState<boolean>(false);

  const scrollTimeoutRef = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);

  // Open modal based on explicit user trigger
  const handleOpenCheckpointModal = useCallback((checkpointId: number) => {
    if (checkpointId === 1) setSkillsOpen(true);
    else if (checkpointId === 2) setExperienceOpen(true);
    else if (checkpointId === 3) setPhilosophyOpen(true);
    else if (checkpointId === 4) setContactOpen(true);
  }, []);

  // Smooth scroll progression calculation
  const updateScroll = useCallback((delta: number) => {
    setScrollProgress((prev) => {
      const next = Math.max(0, Math.min(1, prev + delta));
      if (Math.abs(next - 0.25) < 0.08) setActiveCheckpoint(1);
      else if (Math.abs(next - 0.55) < 0.08) setActiveCheckpoint(2);
      else if (Math.abs(next - 0.80) < 0.08) setActiveCheckpoint(3);
      else if (next >= 0.92) setActiveCheckpoint(4);
      else setActiveCheckpoint(null);
      return next;
    });

    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 180);
  }, []);

  // Wheel listener
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.overflow-y-auto')) {
        return; // Allow natural scrolling inside modal / card lists
      }
      e.preventDefault();
      const sensitivity = 0.00085;
      updateScroll(e.deltaY * sensitivity);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [updateScroll]);

  // Touch listener for mobile devices
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.overflow-y-auto')) {
        return;
      }
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY.current - touchY;
      touchStartY.current = touchY;
      const sensitivity = 0.0024;
      updateScroll(deltaY * sensitivity);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [updateScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const step = 0.045;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        updateScroll(step);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'PageUp') {
        e.preventDefault();
        updateScroll(-step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setScrollProgress(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setScrollProgress(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateScroll]);

  const handleJumpToProgress = useCallback((targetP: number) => {
    setScrollProgress(targetP);
    if (Math.abs(targetP - 0.25) < 0.08) setActiveCheckpoint(1);
    else if (Math.abs(targetP - 0.55) < 0.08) setActiveCheckpoint(2);
    else if (Math.abs(targetP - 0.80) < 0.08) setActiveCheckpoint(3);
    else if (targetP >= 0.92) setActiveCheckpoint(4);
    else setActiveCheckpoint(null);
  }, []);

  const handleToggleSound = useCallback(() => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#01030a]">
      {/* Photorealistic Cinematic 3D Environment & Dynamic WebGL Canvas */}
      <WorldScene
        scrollProgress={scrollProgress}
        isScrolling={isScrolling}
        activeCheckpoint={activeCheckpoint}
        onCheckpointTrigger={(id) => {
          setActiveCheckpoint(id);
        }}
      />

      {/* Scene 0: Hero Overlay (Smoothly dissolves into mist as expedition begins) */}
      <HeroOverlay
        scrollProgress={scrollProgress}
        onBeginExpedition={() => handleJumpToProgress(0.25)}
      />

      {/* Monoio Inline Scrollytelling Content Engine (Checkpoints 1-4) */}
      <ScrollyContent
        scrollProgress={scrollProgress}
        onOpenResume={() => setResumeOpen(true)}
        onOpenMessage={() => setMessageOpen(true)}
      />

      {/* Floating HUD Controls, Telemetry & Expedition Scrubber */}
      <HUDControls
        scrollProgress={scrollProgress}
        onJumpToProgress={handleJumpToProgress}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        activeCheckpoint={activeCheckpoint}
        onOpenCheckpointModal={handleOpenCheckpointModal}
      />

      {/* Modal Overlays (Opened only when explicitly triggered by user) */}
      <SkillsModal
        isOpen={skillsOpen}
        onClose={() => setSkillsOpen(false)}
      />

      <ExperienceQuestLog
        isOpen={experienceOpen}
        onClose={() => setExperienceOpen(false)}
      />

      <PhilosophyPanel
        isOpen={philosophyOpen}
        onClose={() => setPhilosophyOpen(false)}
      />

      <ContactTerminal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        onOpenResume={() => setResumeOpen(true)}
        onOpenMessage={() => setMessageOpen(true)}
      />

      <ResumeModal
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
      />

      <MessageModal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
      />
    </main>
  );
};
