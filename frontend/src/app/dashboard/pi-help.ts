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
          <div><h2 id="pi-help-title">Pi guide</h2><p>Updates, kiosk controls, passwords, and troubleshooting.</p></div>
          <button cdkFocusInitial type="button" class="close" aria-label="Close Pi guide" (click)="help.open.set(false)">
            <app-ui-icon name="close" />
          </button>
        </header>
        <div class="toolbar">
          <span>Run commands in a terminal on the Pi or through SSH.</span>
          <a href="/PI-INSTRUCTIONS.txt" download="PI-INSTRUCTIONS.txt">Save TXT</a>
        </div>
        <p class="terminal-note"><strong>Need a terminal?</strong> With a keyboard on the Pi, press
          <kbd>Alt + F4</kbd>, then <kbd>Ctrl + Alt + T</kbd>. Without a Pi keyboard, connect
          through SSH from another device. This guide displays commands; it does not run them.</p>
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
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; flex-shrink: 0; }
    h2 { margin: 0; font: 600 clamp(22px, 3vmin, 32px)/1.2 var(--theme-font-display); }
    header p { margin: 6px 0 0; color: var(--theme-text-muted); font-size: 13px; }
    button, a {
      display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px 12px;
      border: 1px solid var(--theme-border); border-radius: var(--control-radius); color: var(--theme-text);
      background: var(--theme-control-bg); font: 600 13px/1.2 var(--theme-font-body); cursor: pointer; text-decoration: none;
    }
    button:hover, a:hover { border-color: var(--theme-primary); background: var(--theme-surface-hover); }
    button:focus-visible, a:focus-visible, pre:focus-visible { outline: 2px solid var(--theme-focus); outline-offset: -3px; }
    .close { flex-shrink: 0; width: 44px; padding: 0; font-size: 22px; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px 12px; border-bottom: 1px solid var(--theme-border); flex-shrink: 0; }
    .toolbar span { font-size: 12px; color: var(--theme-text-muted); }
    .toolbar a { flex-shrink: 0; }
    pre { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; margin: 0; padding: 20px; white-space: pre-wrap; overflow-wrap: anywhere; font: 400 clamp(14px, 1.5vmin, 22px)/1.65 monospace; tab-size: 2; }
    .terminal-note { margin: 0; padding: 12px 20px; font-size: 13px; line-height: 1.5; border-bottom: 1px solid var(--theme-border); color: var(--theme-text-muted); flex-shrink: 0; }
    .terminal-note strong { color: var(--theme-text); }
    kbd { color: var(--theme-primary-bright); white-space: nowrap; }
  `],
})
export class PiHelp {
  readonly help = inject(PiHelpService);
  readonly text = PI_INSTRUCTIONS;
}
