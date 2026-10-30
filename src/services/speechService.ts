class SpeechService {
  private static instance: SpeechService;
  private lastSpokenText = '';
  private lastSpokenTime = 0;
  private audioCtx: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  /**
   * Refined ambient harmonic chime using Web Audio API
   */
  public playDetectChime(pitchMultiplier = 1.0) {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(440 * pitchMultiplier, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880 * pitchMultiplier, now + 0.15); // A5

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio policy
    }
  }

  /**
   * Speak object name with cooldown
   */
  public speak(text: string, cooldownMs = 3500) {
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    if (text === this.lastSpokenText && now - this.lastSpokenTime < cooldownMs) {
      return;
    }

    if (now - this.lastSpokenTime < 1800) {
      return;
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.volume = 0.8;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    window.speechSynthesis.speak(utterance);
    this.playDetectChime();
  }
}

export const speechService = SpeechService.getInstance();
