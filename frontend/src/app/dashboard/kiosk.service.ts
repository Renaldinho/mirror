import { DestroyRef, Injectable, inject, signal } from '@angular/core';

type BrowserMode = 'kiosk' | 'desktop';

@Injectable({ providedIn: 'root' })
export class KioskService {
  readonly available = signal(false);
  readonly mode = signal<BrowserMode>('kiosk');
  readonly busy = signal(false);
  readonly error = signal('');
  private timer?: ReturnType<typeof setTimeout>;

  constructor() { inject(DestroyRef).onDestroy(() => clearTimeout(this.timer)); }

  async refresh(): Promise<void> {
    try {
      const response = await fetch('/api/kiosk', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      if (!response.ok) throw new Error();
      const status = await response.json() as { available: boolean; mode: BrowserMode };
      this.available.set(status.available === true);
      if (status.mode === 'kiosk' || status.mode === 'desktop') this.mode.set(status.mode);
    } catch { this.available.set(false); }
  }

  async switchMode(mode: BrowserMode): Promise<void> {
    if (!this.available() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/kiosk/mode', {
        method: 'POST', signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json', 'X-Mirror-Request': 'kiosk-mode' },
        body: JSON.stringify({ mode }),
      });
      if (!response.ok) throw new Error();
      // Normally the browser restarts before this fires. Recover if the helper stopped.
      this.timer = setTimeout(() => {
        void this.refresh().then(() => {
          this.busy.set(false);
          if (!this.available() || this.mode() !== mode) this.error.set('The browser did not switch. Restart the Pi kiosk and try again.');
        });
      }, 8000);
    } catch {
      this.busy.set(false);
      this.error.set('Could not switch the browser. Check that the updated Pi kiosk is running.');
    }
  }
}
