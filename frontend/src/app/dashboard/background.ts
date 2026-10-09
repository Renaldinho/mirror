import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CURSOR_FX_MODES, SettingsService } from './settings.service';
import { DigitalRain } from './digital-rain';
import { UiIcon } from '../shared/ui-icon';

/** Cinematic code rain, independent of the widget theme. */
@Component({
  selector: 'app-background',
  imports: [DigitalRain, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop pointer-events-none absolute inset-0" aria-hidden="true">
      @if (settings.matrixRain()) { <app-digital-rain id="matrix-background" /> }
    </div>
    <div class="background-controls" role="group" aria-label="Background and pointer effects">
      <button class="matrix-toggle" type="button" [class.on]="settings.matrixRain()"
        aria-label="Toggle Matrix background" [attr.aria-pressed]="settings.matrixRain()"
        title="Turn code rain on or off" (click)="settings.matrixRain.set(!settings.matrixRain())">
        <app-ui-icon name="matrix" />
        <span>Code rain <small>{{ settings.matrixRain() ? 'ON' : 'OFF' }}</small></span>
      </button>
      <button class="pointer-fx" type="button" [class.on]="settings.cursorFx()"
        aria-label="Toggle mouse effects" [attr.aria-pressed]="settings.cursorFx()"
        (click)="settings.toggleCursorFx()">
        <app-ui-icon name="sparkle" />
        <span>FX <small>{{ settings.cursorFx() ? 'ON' : 'OFF' }}</small></span>
      </button>
      <button class="pointer-style" type="button" aria-label="Change mouse effect style"
        title="Cycle mouse effects" (click)="settings.cycleCursorFxMode()">
        <app-ui-icon [name]="cursorMode().icon" />
        <span>{{ cursorMode().label }}</span>
      </button>
    </div>
  `,
  styles: [`
    .backdrop { overflow: hidden; background: #000; }
    .background-controls {
      position: fixed; right: max(16px, env(safe-area-inset-right));
      bottom: max(16px, env(safe-area-inset-bottom)); z-index: 35;
      display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px;
      max-width: calc(100vw - 80px);
    }
    button {
      display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 8px 10px;
      border: 1px solid var(--theme-border-strong); border-radius: var(--control-radius);
      background: var(--theme-panel-opaque); color: var(--theme-text); cursor: pointer;
      font: 600 13px/1.2 var(--theme-font-body);
    }
    app-ui-icon { font-size: 22px; }
    small { display: block; margin-top: 3px; font: 700 9px/1 monospace; letter-spacing: .12em; }
    button.on { border-color: #28b765; }
    button.on app-ui-icon, button.on small { color: #6dffa2; }
  `],
})
export class Background {
  readonly settings = inject(SettingsService);
  readonly cursorMode = computed(() =>
    CURSOR_FX_MODES.find((mode) => mode.id === this.settings.cursorFxMode()) ?? CURSOR_FX_MODES[0]);
}
