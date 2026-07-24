import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

/** Elegant serif clock + date. Local only, ticks every second. */
@Component({
  selector: 'app-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col items-center justify-center gap-2 text-center select-none">
      <div class="text-5xl font-medium tracking-wide text-parchment tabular-nums">{{ time() }}</div>
      <div class="text-xs uppercase tracking-[0.3em] text-gold">{{ date() }}</div>
    </div>
  `,
})
export class ClockWidget {
  readonly time = signal('');
  readonly date = signal('');

  constructor() {
    const tick = () => {
      const now = new Date();
      this.time.set(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      );
      this.date.set(
        now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
