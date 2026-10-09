import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { DigitalRain } from './digital-rain';
import { UiIcon } from '../shared/ui-icon';

/** Cinematic code rain and white illumination, independent of the widget theme. */
@Component({
  selector: 'app-background',
  imports: [DigitalRain, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop pointer-events-none absolute inset-0" aria-hidden="true">
      @if (settings.matrixRain()) { <app-digital-rain id="matrix-background" /> }
      <div class="ring-light"
        [style.opacity]="light()"
        [style.width.%]="settings.ringSize()"
        [style.height.%]="settings.ringSize()">
      </div>
    </div>
    <button class="matrix-toggle" type="button" [class.on]="settings.matrixRain()"
      aria-label="Toggle Matrix background" [attr.aria-pressed]="settings.matrixRain()"
      title="Turn code rain on or off" (click)="settings.matrixRain.set(!settings.matrixRain())">
      <app-ui-icon name="matrix" />
      <span>Code rain <small>{{ settings.matrixRain() ? 'ON' : 'OFF' }}</small></span>
    </button>
  `,
  styles: [`
    .backdrop { overflow: hidden; background: #000; }
    .matrix-toggle {
      position: fixed; right: max(16px, env(safe-area-inset-right));
      bottom: max(16px, env(safe-area-inset-bottom)); z-index: 35;
      display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 14px;
      border: 1px solid var(--theme-border-strong); border-radius: var(--control-radius);
      background: var(--theme-panel-opaque); color: var(--theme-text); cursor: pointer;
      font: 600 13px/1.2 var(--theme-font-body);
    }
    .matrix-toggle app-ui-icon { font-size: 22px; }
    .matrix-toggle small { display: block; margin-top: 3px; font: 700 9px/1 monospace; letter-spacing: .12em; }
    .matrix-toggle.on { border-color: #28b765; }
    .matrix-toggle.on app-ui-icon, .matrix-toggle.on small { color: #6dffa2; }
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
