import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';
import { UiIcon } from '../shared/ui-icon';
import { PI_INSTRUCTIONS } from './pi-instructions.generated';

@Injectable({ providedIn: 'root' })
export class PiHelpService {
  readonly open = signal(false);
}

/** Read the same guide shipped as the desktop TXT, locally inside the kiosk. */
@Component({
  selector: 'app-pi-help',
  imports: [CdkTrapFocus, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="help.open.set(false)">
      <section role="dialog" aria-modal="true" aria-labelledby="pi-help-title"
        cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (click)="$event.stopPropagation()"
        (keydown.escape)="$event.stopPropagation(); help.open.set(false)">
        <header>
          <h2 id="pi-help-title">Pi guide</h2>
          <div class="actions">
            <a href="/PI-INSTRUCTIONS.txt" download="PI-INSTRUCTIONS.txt">Save TXT</a>
          <button cdkFocusInitial type="button" class="close" aria-label="Close Pi guide" (click)="help.open.set(false)">
            <app-ui-icon name="close" />
          </button>
          </div>
        </header>
        <pre tabindex="0" aria-label="Pi instructions">{{ text }}</pre>
      </section>
    </div>
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, .75); }
    section {
      display: flex; flex-direction: column; width: min(1000px, 100%); height: min(1000px, calc(100dvh - 32px)); min-height: 0;
      border: 1px solid var(--theme-border-strong); border-radius: var(--panel-radius);
      background: var(--theme-panel-opaque); color: var(--theme-text); box-shadow: var(--theme-shadow-strong); overflow: hidden;
    }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; flex-shrink: 0; border-bottom: 1px solid var(--theme-border); }
    h2 { margin: 0; font: 600 clamp(22px, 3vmin, 32px)/1.2 var(--theme-font-display); }
    button, a {
      display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px 12px;
      border: 1px solid var(--theme-border); border-radius: var(--control-radius); color: var(--theme-text);
      background: var(--theme-control-bg); font: 600 13px/1.2 var(--theme-font-body); cursor: pointer; text-decoration: none;
    }
    button:hover, a:hover { border-color: var(--theme-primary); background: var(--theme-surface-hover); }
    button:focus-visible, a:focus-visible, pre:focus-visible { outline: 2px solid var(--theme-focus); outline-offset: -3px; }
    .close { flex-shrink: 0; width: 44px; padding: 0; font-size: 22px; }
    .actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    pre { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; margin: 0; padding: 20px; white-space: pre-wrap; overflow-wrap: anywhere; font: 400 clamp(14px, 1.5vmin, 22px)/1.65 monospace; tab-size: 2; }
  `],
})
export class PiHelp {
  readonly help = inject(PiHelpService);
  readonly text = PI_INSTRUCTIONS;
}
