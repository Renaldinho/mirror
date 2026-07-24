import { Injectable, inject } from '@angular/core';
import { GamesService } from './games.service';

type Sfx = 'shot' | 'quack' | 'hit' | 'laugh' | 'point' | 'gameover';

/**
 * Synthesized sound effects (no audio assets). The AudioContext is created
 * lazily on first play so it starts after a user gesture. Silent when muted.
 */
@Injectable({ providedIn: 'root' })
export class AudioFx {
  private readonly games = inject(GamesService);
  private ctx: AudioContext | null = null;

  play(sfx: Sfx): void {
    if (this.games.muted()) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    switch (sfx) {
      case 'shot':
        this.noise(ctx, t, 0.12, 0.35);
        this.tone(ctx, t, 140, 90, 0.08, 'square', 0.2);
        break;
      case 'quack':
        this.tone(ctx, t, 320, 210, 0.14, 'sawtooth', 0.18);
        break;
      case 'hit':
        this.tone(ctx, t, 880, 1200, 0.1, 'triangle', 0.25);
        break;
      case 'point':
        this.tone(ctx, t, 660, 990, 0.12, 'square', 0.2);
        break;
      case 'laugh':
        [520, 440, 360, 300].forEach((f, i) =>
          this.tone(ctx, t + i * 0.11, f, f * 0.9, 0.1, 'sawtooth', 0.16),
        );
        break;
      case 'gameover':
        [440, 330, 262, 196].forEach((f, i) =>
          this.tone(ctx, t + i * 0.16, f, f, 0.16, 'triangle', 0.2),
        );
        break;
    }
  }

  private tone(
    ctx: AudioContext,
    start: number,
    from: number,
    to: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private noise(ctx: AudioContext, start: number, dur: number, gain: number): void {
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffer;
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(g).connect(ctx.destination);
    src.start(start);
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }
}
