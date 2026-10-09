import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { isThemeId, ThemeId } from './theme-registry';
import { IconName } from '../shared/ui-icon';

export const CURSOR_FX_MODES = [
  { id: 'laser', label: 'Laser', icon: 'sparkle' },
  { id: 'glitter', label: 'Glitter', icon: 'glitter' },
  { id: 'matrix', label: 'Matrix', icon: 'matrix' },
  { id: 'flame', label: 'Flame', icon: 'flame' },
  { id: 'bubbles', label: 'Bubbles', icon: 'bubbles' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

export type CursorFxMode = (typeof CURSOR_FX_MODES)[number]['id'];

/** Background and pointer preferences, independent of the widget theme. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);

  readonly matrixRain = signal(this.loadBool('dash.background.matrix', true));
  /** Active visual system. Layout and widget state remain theme-independent. */
  readonly theme = signal<ThemeId>(this.loadTheme());
  /** Nostalgic custom pointer and particle trail for mouse-like input. */
  readonly cursorFx = signal(this.loadBool('dash.cursor.fx.v2', false));
  /** Selected pointer particle system. */
  readonly cursorFxMode = signal<CursorFxMode>(this.loadCursorFxMode());

  constructor() {
    for (const key of ['dash.bg.on', 'dash.bg.light', 'dash.ring.size', 'dash.ambience.auto']) {
      localStorage.removeItem(key);
    }
    effect(() => localStorage.setItem('dash.background.matrix', JSON.stringify(this.matrixRain())));
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

  private loadTheme(): ThemeId {
    const stored = localStorage.getItem('dash.theme.v1') ?? '';
    return isThemeId(stored) ? stored : 'bare';
  }

  private loadCursorFxMode(): CursorFxMode {
    const stored = localStorage.getItem('dash.cursor.fx.mode');
    return CURSOR_FX_MODES.some((mode) => mode.id === stored) ? (stored as CursorFxMode) : 'laser';
  }
}
