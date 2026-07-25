import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { WidgetVariantId } from '../dashboard/widget-registry';

/** A local clock with digital and circular dial layouts. */
@Component({
  selector: 'app-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'dial') {
      <div
        class="dial-layout"
        role="timer"
        [attr.aria-label]="time() + ', ' + date()"
      >
        <div class="dial" aria-hidden="true">
          @for (marker of markers; track marker) {
            <span class="tick" [style.--tick]="marker"></span>
          }
          <span class="hand hour" [style.transform]="hourHand()"></span>
          <span class="hand minute" [style.transform]="minuteHand()"></span>
          <span class="hand second" [style.transform]="secondHand()"></span>
          <span class="pin"></span>
          <span class="dial-date">{{ shortDate() }}</span>
        </div>
      </div>
    } @else {
      <div class="digital-layout select-none">
        <div class="digital-time">{{ time() }}</div>
        <div class="digital-date">{{ date() }}</div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .digital-layout,
      .dial-layout {
        position: relative;
        display: flex;
        height: 100%;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .digital-layout,
      .dial-layout {
        flex-direction: column;
        gap: 8px;
      }
      .digital-time {
        color: var(--theme-text);
        font: 500 3rem/1 var(--theme-font-display);
        font-variant-numeric: tabular-nums;
        letter-spacing: .04em;
      }
      .digital-date {
        color: var(--accent);
        font-size: .72rem;
        letter-spacing: .26em;
        text-transform: uppercase;
      }
      .dial {
        position: relative;
        width: 164px;
        aspect-ratio: 1;
        border: 1px solid color-mix(in srgb, var(--accent) 70%, transparent);
        border-radius: 50%;
        background:
          radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 58%),
          color-mix(in srgb, var(--frame-bg) 78%, transparent);
        box-shadow:
          inset 0 0 0 5px color-mix(in srgb, var(--accent) 7%, transparent),
          0 0 28px color-mix(in srgb, var(--accent) 12%, transparent);
      }
      .tick {
        position: absolute;
        inset: 7px;
        transform: rotate(calc(var(--tick) * 30deg));
      }
      .tick::before {
        content: '';
        display: block;
        width: 1px;
        height: 8px;
        margin: 0 auto;
        background: color-mix(in srgb, var(--accent) 82%, var(--theme-text));
      }
      .tick:nth-child(3n + 1)::before {
        width: 2px;
        height: 12px;
      }
      .hand {
        position: absolute;
        left: 50%;
        bottom: 50%;
        z-index: 2;
        width: 2px;
        border-radius: 999px;
        background: var(--theme-text);
        transform-origin: 50% 100%;
        box-shadow: 0 0 8px color-mix(in srgb, var(--theme-text) 24%, transparent);
      }
      .hour { height: 40px; }
      .minute { height: 57px; width: 1.5px; }
      .second {
        height: 62px;
        width: 1px;
        background: var(--accent);
      }
      .pin {
        position: absolute;
        z-index: 3;
        left: 50%;
        top: 50%;
        width: 7px;
        height: 7px;
        border: 2px solid var(--accent);
        border-radius: 50%;
        background: var(--frame-bg);
        transform: translate(-50%, -50%);
      }
      .dial-date {
        position: absolute;
        left: 50%;
        bottom: 29px;
        color: var(--theme-text-muted);
        font-size: 9px;
        letter-spacing: .18em;
        text-transform: uppercase;
        transform: translateX(-50%);
        white-space: nowrap;
      }
    `,
  ],
})
export class ClockWidget {
  readonly variant = input<WidgetVariantId>('digital');
  readonly now = signal(new Date());
  readonly markers = Array.from({ length: 12 }, (_, index) => index);

  readonly time = computed(() =>
    this.now().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );
  readonly date = computed(() =>
    this.now().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }),
  );
  readonly shortDate = computed(() =>
    this.now().toLocaleDateString([], { day: '2-digit', month: 'short' }),
  );
  readonly hourHand = computed(() => {
    const now = this.now();
    return this.handTransform(((now.getHours() % 12) + now.getMinutes() / 60) * 30);
  });
  readonly minuteHand = computed(() => {
    const now = this.now();
    return this.handTransform((now.getMinutes() + now.getSeconds() / 60) * 6);
  });
  readonly secondHand = computed(() => this.handTransform(this.now().getSeconds() * 6));

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  private handTransform(degrees: number): string {
    return `translateX(-50%) rotate(${degrees}deg)`;
  }
}
