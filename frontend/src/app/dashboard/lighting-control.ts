import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  LIGHTING_LEVELS,
  LightingPreset,
  SettingsService,
} from './settings.service';
import { THEMES } from './theme-registry';

/** Warm mirror-light presets plus continuous manual adjustment. */
@Component({
  selector: 'app-lighting-control',
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
        {{ settings.bgOn() ? themeGlyph() : '◑' }}
      </button>

      <div class="presets" role="group" aria-label="Lighting presets">
        @for (preset of presets; track preset.id) {
          <button
            type="button"
            [class.active]="isPreset(preset.id)"
            [attr.aria-pressed]="isPreset(preset.id)"
            (click)="settings.setLightingPreset(preset.id)"
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
          (input)="settings.setLight($any($event.target).valueAsNumber)"
        />
      </label>

      <output class="level" aria-live="polite">
        {{ settings.bgOn() ? settings.bgLight() : 'off' }}
      </output>
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
        backdrop-filter: blur(12px);
        color: var(--theme-text);
      }
      button { cursor: pointer; }
      .power {
        display: grid; width: 28px; height: 28px; place-items: center;
        border-radius: calc(var(--control-radius) - 2px);
        color: var(--theme-text-muted); font-size: 17px; line-height: 1;
      }
      .power.on { color: var(--theme-primary-bright); }
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
      @media (max-width: 700px) {
        .lighting-shell { right: 12px; top: 60px; }
        .slider-label, .level { display: none; }
      }
    `,
  ],
})
export class LightingControl {
  readonly settings = inject(SettingsService);
  readonly presets: readonly { id: LightingPreset; label: string }[] = [
    { id: 'off', label: 'Off' },
    { id: 'soft', label: 'Soft' },
    { id: 'bright', label: 'Bright' },
  ];
  readonly themeGlyph = computed(
    () => THEMES.find((theme) => theme.id === this.settings.theme())?.glyph ?? '◉',
  );

  isPreset(preset: LightingPreset): boolean {
    if (preset === 'off') {
      return !this.settings.bgOn();
    }

    return this.settings.bgOn() && this.settings.bgLight() === LIGHTING_LEVELS[preset];
  }
}
