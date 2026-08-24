class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = true;

  // Wind nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windNoise: AudioBufferSourceNode | null = null;

  // Aurora chime nodes
  private auroraGain: GainNode | null = null;
  private auroraInterval: number | null = null;

  // Footstep throttle
  private lastFootstepTime = 0;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isInitialized = true;
      this.setupWindGenerator();
      this.setupAuroraHarmonics();
    } catch (e) {
      console.warn('Web Audio API not supported or initialized', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.init();
    this.resume();
    this.isMuted = !this.isMuted;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.09, now, 0.5);
      }
      if (this.auroraGain) {
        this.auroraGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.06, now, 0.8);
      }
    }

    if (!this.isMuted) {
      this.playChime(587.33, 'triangle', 0.2); // D5
    }

    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private setupWindGenerator() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    // Generate brown / pink noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    whiteNoise.start();

    this.windNoise = whiteNoise;
    this.windFilter = filter;
    this.windGain = gain;

    // Slow wind modulation LFO
    setInterval(() => {
      if (!this.ctx || !this.windFilter || this.isMuted) return;
      const targetFreq = 220 + Math.random() * 300;
      this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 2.0);
    }, 3000);
  }

  private setupAuroraHarmonics() {
    if (!this.ctx) return;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.auroraGain = masterGain;

    const chords = [
      [220.00, 277.18, 329.63, 440.00], // A Major
      [196.00, 246.94, 293.66, 392.00], // G Major
      [164.81, 207.65, 246.94, 329.63], // E Major
      [293.66, 369.99, 440.00, 587.33]  // D Major
    ];

    let chordIndex = 0;
    this.auroraInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      currentChord.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.isMuted && this.ctx) {
            this.playEtherealPad(freq, 4.0);
          }
        }, i * 400);
      });
    }, 6000);
  }

  private playEtherealPad(freq: number, duration: number) {
    if (!this.ctx || !this.auroraGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.auroraGain);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public playFootstep() {
    if (this.isMuted || !this.ctx) return;
    const now = Date.now();
    if (now - this.lastFootstepTime < 280) return; // Prevent too frequent crunch
    this.lastFootstepTime = now;

    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400 + Math.random() * 600, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const ct = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.08, ct);
      gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(ct);
    } catch {
      // Audio fallback
    }
  }

  public playChime(freq = 523.25, type: OscillatorType = 'sine', duration = 0.5) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // Ignore
    }
  }

  public playCheckpointArrive() {
    this.playChime(440, 'triangle', 0.4);
    setTimeout(() => this.playChime(659.25, 'sine', 0.6), 120);
    setTimeout(() => this.playChime(880, 'sine', 0.8), 240);
  }
}

export const audioEngine = new AudioEngine();
