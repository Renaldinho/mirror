import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Botanical ambient background — soft moss/mushroom glow + faint mushrooms and
 * ferns. Its overall opacity is the "lighting" level; when the background is
 * off it fades to nothing and the pure-black body behind it becomes a mirror.
 */
@Component({
  selector: 'app-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none absolute inset-0 transition-opacity duration-500"
      [style.opacity]="opacity()"
    >
      <!-- moss + mushroom-cap glow -->
      <div class="glow absolute inset-0"></div>

      <!-- faint botanical silhouettes along the base -->
      <svg class="absolute inset-x-0 bottom-0 h-1/2 w-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice">
        <g fill="var(--color-fern)" opacity="0.16">
          <!-- fern fronds -->
          <path d="M20 200 C 30 150 25 120 40 90 C 30 120 45 150 60 200 Z" />
          <path d="M355 200 C 345 145 360 115 375 95 C 360 120 372 155 385 200 Z" />
        </g>
        <g opacity="0.18">
          <!-- mushrooms -->
          <g transform="translate(120 150)">
            <rect x="-4" y="0" width="8" height="40" rx="3" fill="var(--color-spore)" />
            <path d="M-22 4 Q 0 -26 22 4 Z" fill="var(--color-cap)" />
          </g>
          <g transform="translate(280 165) scale(0.8)">
            <rect x="-4" y="0" width="8" height="40" rx="3" fill="var(--color-spore)" />
            <path d="M-22 4 Q 0 -26 22 4 Z" fill="var(--color-cap)" />
          </g>
          <g transform="translate(210 175) scale(0.55)">
            <rect x="-4" y="0" width="8" height="40" rx="3" fill="var(--color-spore)" />
            <path d="M-22 4 Q 0 -26 22 4 Z" fill="var(--color-moss)" />
          </g>
        </g>
      </svg>
    </div>
  `,
  styles: [
    `
      .glow {
        background:
          radial-gradient(60% 45% at 50% 38%, color-mix(in srgb, var(--color-moss) 30%, transparent), transparent 70%),
          radial-gradient(40% 30% at 22% 75%, color-mix(in srgb, var(--color-cap) 22%, transparent), transparent 70%),
          radial-gradient(45% 35% at 80% 70%, color-mix(in srgb, var(--color-fern) 26%, transparent), transparent 72%),
          #0b0d0a;
      }
    `,
  ],
})
export class Background {
  private readonly settings = inject(SettingsService);

  /** Off = 0 (pure black mirror). On = scaled by the lighting level (min floor so it's visible). */
  readonly opacity = computed(() =>
    this.settings.bgOn() ? 0.15 + (this.settings.bgLight() / 100) * 0.85 : 0,
  );
}
