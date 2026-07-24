import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Smart-mirror backlight + botanical ambiance. The bright warm "bloom" is the
 * actual light thrown onto her face and scales directly with the lighting level,
 * so at high settings the screen genuinely glows. Botanical silhouettes sit on
 * top for flavour. Background off → everything fades and the black body reflects.
 */
@Component({
  selector: 'app-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none absolute inset-0 transition-opacity duration-500"
      [style.opacity]="onFactor()"
    >
      <!-- warm backlight bloom — the face light -->
      <div class="bloom absolute inset-0" [style.opacity]="light()"></div>
      <!-- botanical colour wash -->
      <div class="glow absolute inset-0" [style.opacity]="0.4 + light() * 0.5"></div>

      <!-- faint botanical silhouettes along the base -->
      <svg
        class="absolute inset-x-0 bottom-0 h-1/2 w-full"
        [style.opacity]="0.5 + light() * 0.35"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
      >
        <g fill="var(--color-fern)" opacity="0.5">
          <path d="M20 200 C 30 150 25 120 40 90 C 30 120 45 150 60 200 Z" />
          <path d="M355 200 C 345 145 360 115 375 95 C 360 120 372 155 385 200 Z" />
        </g>
        <g>
          <g transform="translate(120 150)">
            <rect x="-4" y="0" width="8" height="40" rx="3" fill="var(--color-spore)" opacity="0.5" />
            <path d="M-22 4 Q 0 -26 22 4 Z" fill="var(--color-cap)" opacity="0.7" />
          </g>
          <g transform="translate(280 165) scale(0.8)">
            <rect x="-4" y="0" width="8" height="40" rx="3" fill="var(--color-spore)" opacity="0.5" />
            <path d="M-22 4 Q 0 -26 22 4 Z" fill="var(--color-cap)" opacity="0.7" />
          </g>
          <g transform="translate(210 175) scale(0.55)">
            <rect x="-4" y="0" width="8" height="40" rx="3" fill="var(--color-spore)" opacity="0.5" />
            <path d="M-22 4 Q 0 -26 22 4 Z" fill="var(--color-moss)" opacity="0.7" />
          </g>
        </g>
      </svg>
    </div>
  `,
  styles: [
    `
      .bloom {
        background:
          radial-gradient(
            100% 90% at 50% 40%,
            rgba(255, 250, 238, 1),
            rgba(250, 232, 198, 0.78) 45%,
            rgba(214, 204, 154, 0.4) 72%,
            rgba(120, 130, 90, 0.12) 90%,
            transparent
          ),
          rgba(255, 249, 234, 0.12);
      }
      .glow {
        /* botanical colour pooled at the edges/foot so the centre stays bright */
        background:
          radial-gradient(42% 32% at 16% 84%, color-mix(in srgb, var(--color-cap) 42%, transparent), transparent 70%),
          radial-gradient(46% 34% at 86% 80%, color-mix(in srgb, var(--color-fern) 44%, transparent), transparent 74%),
          radial-gradient(60% 42% at 50% 100%, color-mix(in srgb, var(--color-moss) 42%, transparent), transparent 72%);
      }
    `,
  ],
})
export class Background {
  private readonly settings = inject(SettingsService);

  /** Master fade when toggled off (pure-black mirror). */
  readonly onFactor = computed(() => (this.settings.bgOn() ? 1 : 0));
  /** 0..1 lighting level driving the bright bloom. */
  readonly light = computed(() => this.settings.bgLight() / 100);
}
