import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/** Neutral mirror glass and white illumination, independent of the widget theme. */
@Component({
  selector: 'app-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop pointer-events-none absolute inset-0" aria-hidden="true">
      <div class="ring-light"
        [style.opacity]="light()"
        [style.width.%]="settings.ringSize()"
        [style.height.%]="settings.ringSize()">
      </div>
    </div>
  `,
  styles: [`
    .backdrop { overflow: hidden; background: #000; }
    .ring-light {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      box-sizing: border-box;
      border: clamp(16px, 2.8vmin, 60px) solid #fff;
      border-radius: 50%;
      background: transparent;
      box-shadow:
        0 0 1vmin rgba(255, 255, 255, .7),
        0 0 3vmin rgba(255, 255, 255, .22),
        inset 0 0 1vmin rgba(255, 255, 255, .7),
        inset 0 0 3vmin rgba(255, 255, 255, .22);
      transition: opacity 250ms ease;
    }
  `],
})
export class Background {
  readonly settings = inject(SettingsService);
  readonly light = computed(() => this.settings.bgOn() ? Math.sqrt(this.settings.bgLight() / 100) : 0);
}
