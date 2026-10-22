import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { GamesService } from './games.service';
import { SettingsService } from '../dashboard/settings.service';

type Sfx = 'shot' | 'quack' | 'hit' | 'laugh' | 'point' | 'gameover' | 'start' | 'record' | 'bonk' | 'pop' | 'miss' | 'bounce';

/**
 * Recorded shotgun blast plus synthesized arcade cues. The AudioContext is created
 * lazily on first play so it starts after a user gesture. Silent when muted.
 */
@Injectable({ providedIn: 'root' })
export class AudioFx {
  private readonly games = inject(GamesService);
  private readonly settings = inject(SettingsService);
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private shot: AudioBuffer | null = null;
  private loadingShot = false;

  constructor() {
    effect(() => {
      const volume = this.games.muted() ? 0 : this.settings.effectiveVolume();
      if (this.ctx && this.master) this.master.gain.setValueAtTime(volume, this.ctx.currentTime);
    });
    inject(DestroyRef).onDestroy(() => { void this.ctx?.close().catch(() => {}); });
  }

  play(sfx: Sfx): void {
    if (this.games.muted() || this.settings.effectiveVolume() === 0) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    const t = ctx.currentTime;

    switch (sfx) {
      case 'bounce':
        this.tone(ctx, t, 360, 320, .055, 'square', .12);
        break;
      case 'start':
      case 'record':
        (sfx === 'record' ? [523, 659, 784, 1047] : [392, 523, 784]).forEach((f, i) =>
          this.tone(ctx, t + i * .1, f, f, .12, 'triangle', .22));
        break;
      case 'bonk':
        this.tone(ctx, t, 240, 65, .16, 'triangle', .35);
        this.noise(ctx, t, .05, .15);
        break;
      case 'pop':
        this.tone(ctx, t, 180, 540, .07, 'sine', .16);
        break;
      case 'miss':
        this.tone(ctx, t, 180, 75, .14, 'sawtooth', .12);
        break;
      case 'shot':
        if (this.shot) {
          const source = ctx.createBufferSource();
          source.buffer = this.shot;
          source.connect(this.master!);
          source.start(t);
        } else {
          this.noise(ctx, t, .22, .6);
          this.tone(ctx, t, 120, 45, .16, 'triangle', .3);
        }
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
    osc.connect(g).connect(this.master!);
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
    src.connect(g).connect(this.master!);
    src.start(start);
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.setValueAtTime(this.settings.effectiveVolume(), this.ctx.currentTime);
      this.master.connect(this.ctx.destination);
      this.preloadShot(this.ctx);
    } catch {
      return null;
    }
    return this.ctx;
  }

  private preloadShot(ctx: AudioContext): void {
    if (this.loadingShot || this.shot) return;
    this.loadingShot = true;
    void fetch('/sounds/shotgun.wav')
      .then((response) => {
        if (!response.ok) throw new Error('Shot sound unavailable');
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => { this.shot = buffer; })
      .catch(() => { /* Keep a synthesized blast if the local asset cannot load. */ });
  }
}
