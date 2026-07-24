import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Mirror lighting control: toggle the botanical background on/off (off = pure
 * black = a clear mirror) and dim its glow so her reflection stays visible.
 */
@Component({
  selector: 'app-lighting-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed right-4 top-4 z-20 flex items-center gap-3 rounded-full border border-gold/30
             bg-wine/70 px-3 py-1.5 backdrop-blur-sm"
    >
      <button
        class="text-lg leading-none"
        [class.text-gold]="settings.bgOn()"
        [class.text-parchment-dim]="!settings.bgOn()"
        (click)="settings.toggleBg()"
        [title]="settings.bgOn() ? 'Turn background off (mirror)' : 'Turn background on'"
      >
        {{ settings.bgOn() ? '🍄' : '◑' }}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        class="lamp h-1 w-28 cursor-pointer appearance-none rounded-full"
        [disabled]="!settings.bgOn()"
        [value]="settings.bgLight()"
        (input)="settings.setLight($any($event.target).valueAsNumber)"
        title="Lighting"
      />
      <span class="w-6 text-right text-[10px] tabular-nums text-parchment-dim">
        {{ settings.bgOn() ? settings.bgLight() : 'off' }}
      </span>
    </div>
  `,
  styles: [
    `
      .lamp {
        background: linear-gradient(to right, var(--color-gold), var(--color-parchment-dim));
      }
      .lamp:disabled { opacity: 0.35; }
      .lamp::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--color-parchment);
        border: 1px solid var(--color-gold);
      }
      .lamp::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--color-parchment);
        border: 1px solid var(--color-gold);
      }
    `,
  ],
})
export class LightingControl {
  readonly settings = inject(SettingsService);
}
