import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

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
      <div class="ambient absolute inset-0"></div>

      @if (artworkUrl(); as artwork) {
        <img
          class="theme-art absolute inset-0"
          [src]="artwork"
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      }

      <div class="atmosphere absolute inset-0"></div>
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
      .theme-art {
        width: 100%;
        height: 100%;
        object-fit: fill;
      }
      .ambient,
      .atmosphere {
        mix-blend-mode: screen;
      }
      [data-motif='bare'] .ambient,
      [data-motif='bare'] .atmosphere {
        display: none;
      }

      [data-motif='mushroom'] .ambient {
        background:
          radial-gradient(circle at 8% 80%, rgba(162, 80, 59, .28), transparent 25%),
          radial-gradient(circle at 92% 78%, rgba(85, 97, 58, .32), transparent 26%);
      }
      [data-motif='mushroom'] .atmosphere {
        opacity: .65;
        background:
          radial-gradient(circle at 18% 66%, #ffd57a 0 1px, transparent 2px),
          radial-gradient(circle at 75% 74%, #ffd57a 0 1.5px, transparent 3px),
          radial-gradient(circle at 88% 38%, #ffd57a 0 1px, transparent 2px);
        animation: twinkle 4s ease-in-out infinite alternate;
      }

      [data-motif='occult'] .ambient {
        opacity: .72;
        background:
          radial-gradient(ellipse at 50% 105%, rgba(159, 20, 42, .42), transparent 58%),
          radial-gradient(circle at 10% 60%, rgba(211, 113, 45, .2), transparent 23%),
          radial-gradient(circle at 90% 60%, rgba(211, 113, 45, .2), transparent 23%);
        animation: flicker 5s ease-in-out infinite alternate;
      }
      [data-motif='occult'] .atmosphere {
        background: linear-gradient(105deg, transparent 36%, rgba(143, 16, 36, .12), transparent 64%);
      }

      [data-motif='star-wars'] .ambient {
        opacity: .52;
        background:
          radial-gradient(circle at 87% 53%, rgba(114, 165, 198, .2), transparent 24%),
          linear-gradient(100deg, transparent 35%, rgba(145, 26, 32, .12) 50%, transparent 65%);
        animation: scan 13s ease-in-out infinite;
      }
      [data-motif='star-wars'] .atmosphere {
        opacity: .5;
        background: repeating-linear-gradient(0deg, transparent 0 5px, rgba(174, 191, 206, .025) 6px);
      }

      [data-motif='warhammer'] .ambient {
        opacity: .65;
        background:
          radial-gradient(ellipse at 50% 110%, rgba(117, 29, 28, .38), transparent 55%),
          radial-gradient(circle at 50% 90%, rgba(169, 133, 72, .18), transparent 35%);
        animation: flicker 8s ease-in-out infinite alternate;
      }
      [data-motif='warhammer'] .atmosphere {
        opacity: .55;
        background:
          radial-gradient(circle at 28% 84%, #d49a52 0 1px, transparent 2px),
          radial-gradient(circle at 67% 79%, #b64e34 0 1px, transparent 2px),
          radial-gradient(circle at 83% 63%, #d49a52 0 1px, transparent 2px);
        animation: embers 7s linear infinite;
      }

      [data-motif='pinkie'] .ambient {
        opacity: .58;
        background:
          radial-gradient(circle at 8% 80%, rgba(255, 143, 202, .34), transparent 28%),
          radial-gradient(circle at 92% 78%, rgba(190, 141, 224, .3), transparent 28%);
      }
      [data-motif='pinkie'] .atmosphere {
        opacity: .75;
        background:
          radial-gradient(circle at 20% 20%, #fff 0 1px, transparent 2px),
          radial-gradient(circle at 76% 28%, #fff 0 1.5px, transparent 3px),
          radial-gradient(circle at 58% 78%, #ffc1e3 0 1px, transparent 2px);
        animation: twinkle 3.5s ease-in-out infinite alternate;
      }

      [data-motif='emo'] .ambient {
        opacity: .32;
        background:
          radial-gradient(ellipse at 50% 100%, rgba(218, 226, 230, .24), transparent 42%),
          linear-gradient(104deg, transparent 18%, rgba(194, 204, 210, .1), transparent 72%);
      }
      [data-motif='emo'] .theme-art {
        opacity: .94;
        filter: grayscale(1) contrast(1.08);
        mix-blend-mode: screen;
      }
      [data-motif='emo'] .atmosphere {
        display: none;
      }

      [data-motif='spooky-gay'] .ambient {
        opacity: .58;
        background: conic-gradient(from 220deg at 50% 120%, #ef476f38, #ffd16638, #5ec97938, #4aa8e938, #b563d438, transparent 72%);
        animation: hue-drift 10s ease-in-out infinite alternate;
      }
      [data-motif='spooky-gay'] .atmosphere {
        opacity: .62;
        background:
          radial-gradient(circle at 20% 20%, #ffd166 0 1px, transparent 2px),
          radial-gradient(circle at 80% 24%, #dd8df2 0 1.5px, transparent 3px),
          radial-gradient(circle at 54% 82%, #37d6b6 0 1px, transparent 2px);
        animation: twinkle 4s ease-in-out infinite alternate;
      }

      @keyframes flicker {
        0%, 18%, 22%, 68%, 72%, 100% { opacity: .58; }
        20%, 70% { opacity: .82; }
      }
      @keyframes scan {
        0%, 20% { transform: translateX(-25%); }
        80%, 100% { transform: translateX(25%); }
      }
      @keyframes twinkle {
        from { opacity: .3; filter: brightness(.85); }
        to { opacity: .85; filter: brightness(1.25); }
      }
      @keyframes embers {
        from { transform: translateY(5%); }
        to { transform: translateY(-8%); }
      }
      @keyframes hue-drift {
        from { filter: hue-rotate(-8deg); }
        to { filter: hue-rotate(14deg); }
      }
    `,
  ],
})
export class Background {
  readonly settings = inject(SettingsService);
  readonly onFactor = computed(() => (this.settings.bgOn() ? 1 : 0));
  readonly light = computed(() => this.settings.bgLight() / 100);
  readonly artworkUrl = computed(() => {
    const theme = this.settings.theme();
    return theme === 'bare' ? null : `/themes/${theme}.webp`;
  });
}
