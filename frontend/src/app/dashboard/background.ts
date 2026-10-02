import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { ThemeId } from './theme-registry';

interface ThemeLighting {
  minBrightness: number;
  maxBrightness: number;
  minSaturation: number;
  maxSaturation: number;
  glow: number;
}

/** Exposure ranges are tuned per artwork instead of applying one amber wash. */
const THEME_LIGHTING = {
  mushroom: {
    minBrightness: 0.66,
    maxBrightness: 1.14,
    minSaturation: 0.62,
    maxSaturation: 1,
    glow: 0.42,
  },
  occult: {
    minBrightness: 0.64,
    maxBrightness: 1.12,
    minSaturation: 0.68,
    maxSaturation: 1,
    glow: 0.38,
  },
  'star-wars': {
    minBrightness: 0.62,
    maxBrightness: 1.16,
    minSaturation: 0.5,
    maxSaturation: 0.9,
    glow: 0.46,
  },
  warhammer: {
    minBrightness: 0.64,
    maxBrightness: 1.13,
    minSaturation: 0.56,
    maxSaturation: 0.9,
    glow: 0.34,
  },
  pinkie: {
    minBrightness: 0.68,
    maxBrightness: 1.12,
    minSaturation: 0.7,
    maxSaturation: 1,
    glow: 0.4,
  },
  emo: { minBrightness: 0.58, maxBrightness: 1.18, minSaturation: 0, maxSaturation: 0, glow: 0.5 },
  'spooky-gay': {
    minBrightness: 0.64,
    maxBrightness: 1.14,
    minSaturation: 0.62,
    maxSaturation: 1,
    glow: 0.44,
  },
} as const satisfies Partial<Record<ThemeId, ThemeLighting>>;

/**
 * Theme-aware smart-mirror illumination. Practical light fills the glass while
 * each decorative theme adds one recognizable illustrated edge composition.
 */
@Component({
  selector: 'app-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="backdrop pointer-events-none absolute inset-0 transition-opacity duration-500"
      [attr.data-motif]="settings.theme()"
      [style.opacity]="onFactor()"
    >
      <div class="practical-light absolute inset-0" [style.opacity]="light()"></div>

      @if (artworkUrl(); as artwork) {
        <img
          class="theme-art absolute inset-0"
          [src]="artwork"
          [style.filter]="artFilter()"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      }

      <div class="scene-light absolute inset-0" [style.opacity]="sceneLightOpacity()"></div>
    </div>
  `,
  styles: [
    `
      .backdrop {
        overflow: hidden;
        background: #000;
      }
      .practical-light {
        background: radial-gradient(circle at 50% 42%, #fff0c7 0%, #ffe0a1 55%, #d99f55 100%);
      }
      .backdrop:not([data-motif='bare']) .practical-light {
        display: none;
      }
      .theme-art {
        width: 100%;
        height: 100%;
        object-fit: fill;
        transition: filter 320ms ease;
      }
      .theme-art {
        mix-blend-mode: screen;
      }
      .scene-light {
        mix-blend-mode: screen;
        transition: opacity 320ms ease;
      }
      [data-motif='bare'] .scene-light {
        display: none;
      }

      [data-motif='mushroom'] .scene-light {
        background:
          radial-gradient(ellipse at 8% 88%, rgba(230, 178, 94, 0.62), transparent 30%),
          radial-gradient(ellipse at 92% 84%, rgba(128, 148, 92, 0.42), transparent 32%);
      }
      [data-motif='occult'] .scene-light {
        background:
          radial-gradient(ellipse at 4% 82%, rgba(218, 104, 47, 0.58), transparent 28%),
          radial-gradient(ellipse at 96% 88%, rgba(150, 18, 38, 0.7), transparent 32%);
      }

      [data-motif='star-wars'] .scene-light {
        background:
          radial-gradient(ellipse at 7% 85%, rgba(177, 208, 226, 0.48), transparent 28%),
          radial-gradient(ellipse at 93% 88%, rgba(174, 24, 32, 0.72), transparent 32%);
      }

      [data-motif='warhammer'] .scene-light {
        background:
          radial-gradient(ellipse at 5% 88%, rgba(177, 128, 64, 0.5), transparent 30%),
          radial-gradient(ellipse at 95% 84%, rgba(110, 35, 30, 0.56), transparent 34%);
      }

      [data-motif='pinkie'] .scene-light {
        background:
          radial-gradient(ellipse at 6% 12%, rgba(255, 174, 214, 0.58), transparent 28%),
          radial-gradient(ellipse at 94% 90%, rgba(190, 141, 224, 0.52), transparent 32%);
      }

      [data-motif='emo'] .theme-art {
        opacity: 0.92;
      }
      [data-motif='emo'] .scene-light {
        background:
          radial-gradient(ellipse at 72% 100%, rgba(168, 198, 218, 0.7), transparent 33%),
          linear-gradient(
            90deg,
            rgba(130, 157, 174, 0.3),
            transparent 14%,
            transparent 86%,
            rgba(130, 157, 174, 0.22)
          );
      }

      [data-motif='spooky-gay'] .scene-light {
        background:
          radial-gradient(ellipse at 4% 86%, rgba(55, 214, 182, 0.6), transparent 28%),
          radial-gradient(ellipse at 96% 82%, rgba(181, 99, 212, 0.66), transparent 32%),
          radial-gradient(ellipse at 50% 110%, rgba(74, 168, 233, 0.22), transparent 42%);
      }
    `,
  ],
})
export class Background {
  readonly settings = inject(SettingsService);
  readonly onFactor = computed(() => (this.settings.bgOn() ? 1 : 0));
  readonly light = computed(() => this.settings.bgLight() / 100);
  readonly artFilter = computed(() => {
    const lighting = THEME_LIGHTING[this.settings.theme() as keyof typeof THEME_LIGHTING];
    if (!lighting) return null;

    const level = this.light();
    const brightness =
      lighting.minBrightness + (lighting.maxBrightness - lighting.minBrightness) * level;
    const saturation =
      lighting.minSaturation + (lighting.maxSaturation - lighting.minSaturation) * level;
    const contrast = 1.1 - level * 0.06;

    return `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
  });
  readonly sceneLightOpacity = computed(() => {
    const lighting = THEME_LIGHTING[this.settings.theme() as keyof typeof THEME_LIGHTING];
    return lighting ? this.light() * lighting.glow : 0;
  });
  readonly artworkUrl = computed(() => {
    const theme = this.settings.theme();
    if (theme === 'bare') return null;
    return `/themes/${theme}-v2.png`;
  });
}
