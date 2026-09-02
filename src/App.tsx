import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorldScene } from './components/canvas/WorldScene';
import { HeroOverlay } from './components/hud/HeroOverlay';
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

  const [skillsOpen, setSkillsOpen] = useState<boolean>(false);
  const [experienceOpen, setExperienceOpen] = useState<boolean>(false);
  const [philosophyOpen, setPhilosophyOpen] = useState<boolean>(false);
  const [contactOpen, setContactOpen] = useState<boolean>(false);
  const [resumeOpen, setResumeOpen] = useState<boolean>(false);
  const [messageOpen, setMessageOpen] = useState<boolean>(false);

  const scrollTimeoutRef = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);

  const handleOpenCheckpointModal = useCallback((checkpointId: number) => {
    if (checkpointId === 1) setSkillsOpen(true);
    else if (checkpointId === 2) setExperienceOpen(true);
    else if (checkpointId === 3) setPhilosophyOpen(true);
    else if (checkpointId === 4) setContactOpen(true);
  }, []);

  const updateScroll = useCallback((delta: number) => {
    setScrollProgress((prev) => {
      const next = Math.max(0, Math.min(1, prev + delta));
      if (Math.abs(next - 0.25) < 0.08) setActiveCheckpoint(1);
      else if (Math.abs(next - 0.55) < 0.08) setActiveCheckpoint(2);
      else if (Math.abs(next - 0.80) < 0.08) setActiveCheckpoint(3);
      else if (next >= 0.94) setActiveCheckpoint(4);
      else setActiveCheckpoint(null);
      return next;
    });

    setIsScrolling(true);
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => setIsScrolling(false), 180);
  }, []);

  // Wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest('.overflow-y-auto')) return;
      e.preventDefault();
      updateScroll(e.deltaY * 0.00085);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [updateScroll]);

  // Touch
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onMove = (e: TouchEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest('.overflow-y-auto')) return;
      const dy = touchStartY.current - e.touches[0].clientY;
      touchStartY.current = e.touches[0].clientY;
      updateScroll(dy * 0.0022);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
    };
  }, [updateScroll]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const step = 0.04;
      if (['ArrowDown', 's', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); updateScroll(step); }
      else if (['ArrowUp', 'w', 'PageUp'].includes(e.key)) { e.preventDefault(); updateScroll(-step); }
      else if (e.key === 'Home') { e.preventDefault(); setScrollProgress(0); }
      else if (e.key === 'End') { e.preventDefault(); setScrollProgress(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [updateScroll]);

  const handleJumpToProgress = useCallback((p: number) => {
    setScrollProgress(p);
    if (Math.abs(p - 0.25) < 0.08) setActiveCheckpoint(1);
    else if (Math.abs(p - 0.55) < 0.08) setActiveCheckpoint(2);
    else if (Math.abs(p - 0.80) < 0.08) setActiveCheckpoint(3);
    else if (p >= 0.94) setActiveCheckpoint(4);
    else setActiveCheckpoint(null);
  }, []);

  const handleToggleSound = useCallback(() => {
    setIsMuted(audioEngine.toggleMute());
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#01030a]">
      {/* THREE.JS 3D WORLD ENGINE */}
      <WorldScene
        scrollProgress={scrollProgress}
        isScrolling={isScrolling}
        activeCheckpoint={activeCheckpoint}
        onCheckpointTrigger={(id) => {
          setActiveCheckpoint(id);
          handleOpenCheckpointModal(id);
        }}
      />

      {/* HERO OVERLAY — dissolves on scroll */}
      <HeroOverlay
        scrollProgress={scrollProgress}
        onBeginExpedition={() => updateScroll(0.04)}
      />

      {/* HUD */}
      <HUDControls
        scrollProgress={scrollProgress}
        onJumpToProgress={handleJumpToProgress}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        activeCheckpoint={activeCheckpoint}
        onOpenCheckpointModal={handleOpenCheckpointModal}
      />

      {/* CHECKPOINT MODALS */}
      <SkillsModal isOpen={skillsOpen} onClose={() => setSkillsOpen(false)} />
      <ExperienceQuestLog isOpen={experienceOpen} onClose={() => setExperienceOpen(false)} />
      <PhilosophyPanel isOpen={philosophyOpen} onClose={() => setPhilosophyOpen(false)} />
      <ContactTerminal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        onOpenResume={() => setResumeOpen(true)}
        onOpenMessage={() => setMessageOpen(true)}
      />
      <ResumeModal isOpen={resumeOpen} onClose={() => setResumeOpen(false)} />
      <MessageModal isOpen={messageOpen} onClose={() => setMessageOpen(false)} />
    </main>
  );
};
