import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { isThemeId, ThemeId } from './theme-registry';
import { IconName } from '../shared/ui-icon';

export type LightingPreset = 'off' | 'soft' | 'bright';

export const CURSOR_FX_MODES = [
  { id: 'laser', label: 'Laser', icon: 'sparkle' },
  { id: 'glitter', label: 'Glitter', icon: 'glitter' },
  { id: 'matrix', label: 'Matrix', icon: 'matrix' },
  { id: 'flame', label: 'Flame', icon: 'flame' },
  { id: 'bubbles', label: 'Bubbles', icon: 'bubbles' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type CursorFxMode = (typeof CURSOR_FX_MODES)[number]['id'];

export const LIGHTING_LEVELS: Record<Exclude<LightingPreset, 'off'>, number> = {
  soft: 70,
  bright: 100,
};

export const RING_SIZE = { min: 50, max: 90, default: 80 } as const;

/**
 * Board/mirror settings. The screen is pure black with lighting off; when it is
 * on, a neutral white ring lights the glass independently of the widget theme.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);

  /** White ring light on (false = pure black mirror). */
  readonly bgOn = signal(this.loadBool('dash.bg.on', true));
  /** White ring brightness, 0–100. */
  readonly bgLight = signal(this.clampLight(this.loadNum('dash.bg.light', LIGHTING_LEVELS.soft)));
  /** Oval diameter as a percentage of the display, leaving room for its glow. */
  readonly ringSize = signal(this.clampRingSize(this.loadNum('dash.ring.size', RING_SIZE.default)));
  /** Active visual system. Layout and widget state remain theme-independent. */
  readonly theme = signal<ThemeId>(this.loadTheme());
  /** Nostalgic custom pointer and particle trail for mouse-like input. */
  readonly cursorFx = signal(this.loadBool('dash.cursor.fx.v2', false));
  /** Selected pointer particle system. */
  readonly cursorFxMode = signal<CursorFxMode>(this.loadCursorFxMode());

  constructor() {
    effect(() => localStorage.setItem('dash.bg.on', JSON.stringify(this.bgOn())));
    effect(() => localStorage.setItem('dash.bg.light', String(this.bgLight())));
    effect(() => localStorage.setItem('dash.ring.size', String(this.ringSize())));
    effect(() => {
      const theme = this.theme();
      localStorage.setItem('dash.theme.v1', theme);
      this.document.documentElement.dataset['theme'] = theme;
    });
    effect(() => {
      const enabled = this.cursorFx();
      const mode = this.cursorFxMode();
      localStorage.setItem('dash.cursor.fx.v2', JSON.stringify(enabled));
      localStorage.setItem('dash.cursor.fx.mode', mode);
      this.document.documentElement.dataset['cursorFx'] = enabled ? 'on' : 'off';
      this.document.documentElement.dataset['cursorFxMode'] = mode;
    });
  }

  toggleBg(): void {
    this.bgOn.update((value) => !value);
  }

  setLight(value: number): void {
    this.bgLight.set(this.clampLight(value));
  }

  setRingSize(value: number): void {
    this.ringSize.set(this.clampRingSize(value));
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

  toggleCursorFx(): void {
    this.cursorFx.update((enabled) => !enabled);
  }

  cycleCursorFxMode(): void {
    const current = CURSOR_FX_MODES.findIndex((mode) => mode.id === this.cursorFxMode());
    const next = CURSOR_FX_MODES[(current + 1) % CURSOR_FX_MODES.length];
    this.cursorFxMode.set(next.id);
    this.cursorFx.set(true);
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

  private loadCursorFxMode(): CursorFxMode {
    const stored = localStorage.getItem('dash.cursor.fx.mode');
    return CURSOR_FX_MODES.some((mode) => mode.id === stored) ? (stored as CursorFxMode) : 'laser';
  }

  private clampLight(value: number): number {
    return Math.max(0, Math.min(100, Number.isFinite(value) ? value : LIGHTING_LEVELS.soft));
  }

  private clampRingSize(value: number): number {
    return Math.max(RING_SIZE.min, Math.min(RING_SIZE.max,
      Number.isFinite(value) ? value : RING_SIZE.default));
  }
}
