import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlarmService } from './alarm.service';

@Component({
  selector: 'app-alarm-popup',
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (alarm.ringing()) {
      <div class="backdrop">
        <section role="dialog" aria-modal="true" [attr.aria-label]="alarm.ringtone().label + ' alarm'"
          cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="alarm.dismiss()">
          <div class="stage">
            <img [src]="alarm.ringtone().image" [alt]="alarm.ringtone().alt" />
          </div>
          @if (alarm.soundError()) {
            <p class="error" role="status">{{ alarm.soundError() }}</p>
            <button type="button" (click)="alarm.playSound()">🔊 Play sound</button>
          }
          <div class="actions">
            <button type="button" (click)="alarm.snooze()">😴 Snooze 5 min</button>
            <button cdkFocusInitial type="button" class="stop" (click)="alarm.dismiss()">🛑 Stop alarm</button>
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; z-index: 2147483646; display: grid; place-items: center; padding: 20px;
      background: radial-gradient(circle at 50% 40%, rgba(120,0,0,.55), rgba(0,0,0,.92));
      cursor: auto; animation: strobe 1.1s steps(2, end) infinite;
    }
    section {
      display: flex; flex-direction: column; align-items: center; gap: 10px; max-height: calc(100dvh - 40px);
      overflow: auto; width: min(460px, 100%); padding: 24px 28px; border: 3px solid var(--theme-primary);
      border-radius: 24px; background: var(--theme-panel-opaque); color: var(--theme-text); text-align: center;
      box-shadow: 0 0 0 4px rgba(0,0,0,.6), 0 0 60px rgba(214,170,105,.45);
    }
    .stage { display: grid; place-items: center; }
    img {
      display: block; width: min(340px, 70vw); height: min(300px, 38dvh); object-fit: contain;
      filter: drop-shadow(0 8px 18px rgba(0,0,0,.6));
    }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 6px; }
    button {
      min-height: 48px; border-radius: 12px; padding: 12px 18px; border: 1px solid var(--theme-border-strong);
      background: var(--theme-control-bg); color: var(--theme-text); cursor: pointer; font-weight: 600;
    }
    .stop { background: var(--theme-primary); color: #080808; font-weight: 800; }
    .error { color: var(--theme-warning, #eebf68); }

    @keyframes strobe {
      0% { background: radial-gradient(circle at 50% 40%, rgba(120,0,0,.55), rgba(0,0,0,.92)); }
      100% { background: radial-gradient(circle at 50% 40%, rgba(60,0,0,.5), rgba(0,0,0,.95)); }
    }
    @media (prefers-reduced-motion: reduce) {
      .backdrop { animation: none; }
    }
  `],
})
export class AlarmPopup { readonly alarm = inject(AlarmService); }
