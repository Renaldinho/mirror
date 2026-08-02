import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AmbienceService } from './ambience.service';
import {
  CURSOR_FX_MODES,
  LIGHTING_LEVELS,
  LightingPreset,
  SettingsService,
} from './settings.service';
import { THEMES } from './theme-registry';
import { IconName, UiIcon } from '../shared/ui-icon';

/** Warm mirror-light presets plus continuous manual adjustment. */
@Component({
  selector: 'app-lighting-control',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lighting-shell fixed right-4 top-4 z-20 flex items-center gap-2" role="group" aria-label="Mirror lighting">
      <button
        type="button"
        class="power"
        [class.on]="settings.bgOn()"
        (click)="settings.toggleBg()"
        [attr.aria-pressed]="settings.bgOn()"
        [attr.aria-label]="settings.bgOn() ? 'Turn mirror lighting off' : 'Turn mirror lighting on'"
        [title]="settings.bgOn() ? 'Turn lighting off' : 'Turn lighting on'"
      >
        <app-ui-icon [name]="settings.bgOn() ? themeIcon() : 'half'" />
      </button>

      <button
        type="button"
        class="auto"
        [class.on]="ambience.autoLight()"
        (click)="ambience.toggleAuto()"
        [attr.aria-pressed]="ambience.autoLight()"
        [attr.aria-label]="ambience.autoLight() ? 'Auto lighting on (dims by time of day)' : 'Auto lighting off'"
        title="Auto-dim by time of day"
      >
        <app-ui-icon aria-hidden="true" name="moon" /><small>AUTO</small>
      </button>

      <div class="presets" role="group" aria-label="Lighting presets">
        @for (preset of presets; track preset.id) {
          <button
            type="button"
            [class.active]="isPreset(preset.id)"
            [attr.aria-pressed]="isPreset(preset.id)"
            (click)="onPreset(preset.id)"
          >
            {{ preset.label }}
          </button>
        }
      </div>

      <label class="slider-label">
        <span class="sr-only">Custom lighting level</span>
        <input
          type="range"
          min="0"
          max="100"
          class="lamp"
          [disabled]="!settings.bgOn()"
          [value]="settings.bgLight()"
          (input)="onManualLight($any($event.target).valueAsNumber)"
        />
      </label>

      <output class="level" aria-live="polite">
        {{ settings.bgOn() ? settings.bgLight() : 'off' }}
      </output>

      <span class="divider" aria-hidden="true"></span>
      <button
        type="button"
        class="pointer-fx"
        [class.on]="settings.cursorFx()"
        [attr.aria-pressed]="settings.cursorFx()"
        [attr.aria-label]="settings.cursorFx() ? 'Turn retro pointer effects off' : 'Turn retro pointer effects on'"
        [title]="settings.cursorFx() ? 'Retro pointer FX on' : 'Retro pointer FX off'"
        (click)="settings.toggleCursorFx()"
      >
        <app-ui-icon aria-hidden="true" name="sparkle" />
        <small>FX</small>
      </button>
      <button
        type="button"
        class="pointer-style"
        [attr.aria-label]="'Pointer style: ' + cursorMode().label + '. Activate for next style.'"
        [title]="'Pointer style: ' + cursorMode().label + ' · click to change'"
        (click)="settings.cycleCursorFxMode()"
      >
        <app-ui-icon aria-hidden="true" [name]="cursorMode().icon" />
        <small>{{ cursorMode().label }}</small>
      </button>
    </div>
  `,
  styles: [
    `
      .lighting-shell {
        padding: 6px 8px;
        border: 1px solid var(--theme-border-strong);
        border-radius: var(--control-radius);
        background: var(--theme-panel);
        box-shadow: var(--theme-shadow-soft);
        backdrop-filter: none;
        color: var(--theme-text);
      }
      button { cursor: pointer; }
      .power {
        display: grid; width: 28px; height: 28px; place-items: center;
        border-radius: calc(var(--control-radius) - 2px);
        color: var(--theme-text-muted); font-size: 17px; line-height: 1;
      }
      .power.on { color: var(--theme-primary-bright); }
      .auto {
        display: flex; height: 28px; align-items: center; gap: 3px; padding: 0 6px;
        border: 1px solid transparent;
        border-radius: calc(var(--control-radius) - 2px);
        color: var(--theme-text-muted);
      }
      .auto span { font-size: 13px; line-height: 1; }
      .auto small { font: 700 8px/1 var(--theme-font-body); letter-spacing: .08em; }
      .auto.on {
        border-color: color-mix(in srgb, var(--theme-primary) 42%, transparent);
        background: var(--theme-primary-soft);
        color: var(--theme-primary-bright);
      }
      .presets {
        display: flex; overflow: hidden;
        border: 1px solid var(--theme-border);
        border-radius: calc(var(--control-radius) - 2px);
        background: var(--theme-control-bg);
      }
      .presets button {
        min-width: 42px; padding: 5px 7px;
        border-right: 1px solid var(--theme-border);
        color: var(--theme-text-muted);
        font: 600 9px/1 var(--theme-font-body);
        letter-spacing: .06em; text-transform: uppercase;
      }
      .presets button:last-child { border-right: 0; }
      .presets button.active { background: var(--theme-primary-soft); color: var(--theme-primary-bright); }
      .slider-label { display: flex; align-items: center; }
      .lamp {
        width: 104px; height: 4px; cursor: pointer; appearance: none;
        border-radius: 999px;
        background: linear-gradient(to right, #9a642f, #f1c978);
      }
      .lamp:disabled { opacity: .28; }
      .lamp::-webkit-slider-thumb {
        appearance: none; width: 14px; height: 14px;
        border: 1px solid #d8a95f; border-radius: 50%;
        background: #ffe8b8; box-shadow: 0 0 8px rgba(255, 215, 142, .45);
      }
      .lamp::-moz-range-thumb {
        width: 14px; height: 14px;
        border: 1px solid #d8a95f; border-radius: 50%;
        background: #ffe8b8; box-shadow: 0 0 8px rgba(255, 215, 142, .45);
      }
      .level {
        width: 25px; color: var(--theme-text-muted);
        font: 600 9px/1 var(--theme-font-body);
        text-align: right; text-transform: uppercase;
      }
      .divider {
        width: 1px;
        height: 20px;
        background: var(--theme-border);
      }
      .pointer-fx {
        display: flex;
        height: 28px;
        align-items: center;
        gap: 3px;
        padding: 0 6px;
        border: 1px solid transparent;
        border-radius: calc(var(--control-radius) - 2px);
        color: var(--theme-text-muted);
        transition: 160ms ease;
      }
      .pointer-fx span {
        font-size: 15px;
        line-height: 1;
      }
      .pointer-fx small {
        font: 700 8px/1 var(--theme-font-body);
        letter-spacing: .08em;
      }
      .pointer-fx.on {
        border-color: color-mix(in srgb, var(--theme-primary) 42%, transparent);
        background: var(--theme-primary-soft);
        color: var(--theme-primary-bright);
        text-shadow: 0 0 8px currentColor;
      }
      .pointer-style {
        display: flex;
        height: 28px;
        align-items: center;
        gap: 4px;
        max-width: 72px;
        padding: 0 7px;
        border: 1px solid var(--theme-border);
        border-radius: calc(var(--control-radius) - 2px);
        background: var(--theme-control-bg);
        color: var(--theme-primary-bright);
      }
      .pointer-style span {
        min-width: 13px;
        font: 700 11px/1 monospace;
        text-align: center;
        text-shadow: 0 0 7px currentColor;
      }
      .pointer-style small {
        overflow: hidden;
        color: var(--theme-text-muted);
        font: 600 8px/1 var(--theme-font-body);
        letter-spacing: .04em;
        text-overflow: ellipsis;
        text-transform: uppercase;
      }
      @media (max-width: 700px) {
        .lighting-shell { right: 12px; top: 60px; }
        .slider-label, .level, .divider, .pointer-fx, .pointer-style { display: none; }
      }
    `,
  ],
})
export class LightingControl {
  readonly settings = inject(SettingsService);
  readonly ambience = inject(AmbienceService);
  readonly presets: readonly { id: LightingPreset; label: string }[] = [
    { id: 'off', label: 'Off' },
    { id: 'soft', label: 'Soft' },
    { id: 'bright', label: 'Bright' },
  ];
  readonly themeIcon = computed<IconName>(
    () => THEMES.find((theme) => theme.id === this.settings.theme())?.icon ?? 'circle',
  );
  readonly cursorMode = computed(
    () =>
      CURSOR_FX_MODES.find((mode) => mode.id === this.settings.cursorFxMode()) ??
      CURSOR_FX_MODES[0],
  );

  /** Manual control takes over from the auto-dim scheduler. */
  onManualLight(value: number): void {
    this.settings.setLight(value);
    this.ambience.disableAuto();
  }

  onPreset(preset: LightingPreset): void {
    this.settings.setLightingPreset(preset);
    this.ambience.disableAuto();
  }

  isPreset(preset: LightingPreset): boolean {
    if (preset === 'off') {
      return !this.settings.bgOn();
    }

    return this.settings.bgOn() && this.settings.bgLight() === LIGHTING_LEVELS[preset];
  }
}
