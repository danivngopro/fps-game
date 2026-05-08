type SoundName = "shoot" | "reload" | "footstep" | "jump" | "land" | "targetHit";

const minIntervals: Record<SoundName, number> = {
  shoot: 70,
  reload: 400,
  footstep: 120,
  jump: 120,
  land: 180,
  targetHit: 70,
};

export class GameAudio {
  private context: AudioContext | null = null;
  private lastPlayed = new Map<SoundName, number>();

  public unlock() {
    void this.getContext()?.resume();
  }

  public play(name: SoundName) {
    const now = performance.now();
    const previous = this.lastPlayed.get(name) ?? -Infinity;
    if (now - previous < minIntervals[name]) return;

    const ctx = this.getContext();
    if (!ctx) return;

    this.lastPlayed.set(name, now);

    if (name === "shoot") this.playShoot(ctx);
    if (name === "reload") this.playReload(ctx);
    if (name === "footstep") this.playFootstep(ctx);
    if (name === "jump") this.playTone(ctx, 160, 0.08, 0.04, "triangle");
    if (name === "land") this.playNoise(ctx, 0.08, 0.06, 900);
    if (name === "targetHit") this.playTone(ctx, 620, 0.06, 0.035, "square");
  }

  private getContext() {
    if (this.context) return this.context;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    this.context = new AudioContextCtor();
    return this.context;
  }

  private playShoot(ctx: AudioContext) {
    this.playNoise(ctx, 0.055, 0.1, 1800);
    this.playTone(ctx, 92, 0.05, 0.05, "sawtooth");
  }

  private playReload(ctx: AudioContext) {
    this.playTone(ctx, 260, 0.08, 0.04, "square", 0);
    this.playTone(ctx, 180, 0.09, 0.035, "square", 0.18);
    this.playTone(ctx, 340, 0.06, 0.03, "triangle", 0.34);
  }

  private playFootstep(ctx: AudioContext) {
    this.playNoise(ctx, 0.045, 0.035, 600);
  }

  private playTone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    delay = 0,
  ) {
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, frequency * 0.55),
      start + duration,
    );
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  private playNoise(
    ctx: AudioContext,
    duration: number,
    volume: number,
    filterFrequency: number,
  ) {
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = filterFrequency;
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }
}

export const gameAudio = new GameAudio();

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
