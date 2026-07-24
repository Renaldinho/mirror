import { Injectable, effect, signal } from '@angular/core';

/**
 * Board/mirror settings. This is a smart-mirror: with the background off the
 * screen is pure black and the glass reflects (mirror mode); the botanical
 * background emits "light" she can dim so her reflection stays visible.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  /** Botanical background on (false = pure black = mirror). */
  readonly bgOn = signal(this.loadBool('dash.bg.on', true));
  /** Lighting level 0–100 (how much glow the background gives off). */
  readonly bgLight = signal(this.loadNum('dash.bg.light', 55));

  constructor() {
    effect(() => localStorage.setItem('dash.bg.on', JSON.stringify(this.bgOn())));
    effect(() => localStorage.setItem('dash.bg.light', String(this.bgLight())));
  }

  toggleBg(): void {
    this.bgOn.update((v) => !v);
  }

  setLight(v: number): void {
    this.bgLight.set(Math.max(0, Math.min(100, v)));
  }

  private loadBool(key: string, fallback: boolean): boolean {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === 'true';
  }
  private loadNum(key: string, fallback: number): number {
    const raw = localStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
}
