import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { isThemeId, ThemeId } from './theme-registry';

export type LightingPreset = 'off' | 'soft' | 'bright';

export const LIGHTING_LEVELS: Record<Exclude<LightingPreset, 'off'>, number> = {
  soft: 40,
  bright: 100,
};

/**
 * Board/mirror settings. The screen is pure black with lighting off; when it is
 * on, a warm edge layer provides practical illumination around the reflection.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);

  /** Background and practical edge lighting on (false = pure black mirror). */
  readonly bgOn = signal(this.loadBool('dash.bg.on', true));
  /** Lighting level 0–100 (how much warm light the background gives off). */
  readonly bgLight = signal(this.clampLight(this.loadNum('dash.bg.light', LIGHTING_LEVELS.soft)));
  /** Active visual system. Layout and widget state remain theme-independent. */
  readonly theme = signal<ThemeId>(this.loadTheme());

  constructor() {
    effect(() => localStorage.setItem('dash.bg.on', JSON.stringify(this.bgOn())));
    effect(() => localStorage.setItem('dash.bg.light', String(this.bgLight())));
    effect(() => {
      const theme = this.theme();
      localStorage.setItem('dash.theme.v1', theme);
      this.document.documentElement.dataset['theme'] = theme;
    });
  }

  toggleBg(): void {
    this.bgOn.update((value) => !value);
  }

  setLight(value: number): void {
    this.bgLight.set(this.clampLight(value));
  }

  setLightingPreset(preset: LightingPreset): void {
    if (preset === 'off') {
      this.bgOn.set(false);
      return;
    }

    this.bgLight.set(LIGHTING_LEVELS[preset]);
    this.bgOn.set(true);
  }

  setTheme(theme: ThemeId): void {
    this.theme.set(theme);
  }

  private loadBool(key: string, fallback: boolean): boolean {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === 'true';
  }

  private loadNum(key: string, fallback: number): number {
    const raw = localStorage.getItem(key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  private loadTheme(): ThemeId {
    const stored = localStorage.getItem('dash.theme.v1') ?? '';
    return isThemeId(stored) ? stored : 'bare';
  }

  private clampLight(value: number): number {
    return Math.max(0, Math.min(100, Number.isFinite(value) ? value : LIGHTING_LEVELS.soft));
  }
}
