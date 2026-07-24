import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

const STORAGE_KEY = 'dash.notes';

/**
 * A parchment scratchpad, saved to localStorage.
 * NOTE (Phase 2): cross-device sync goes here — swap this local read/write for a
 * shared store (hosted BaaS free tier, or an existing synced-notes API) so notes
 * typed on a phone appear on the dashboard. Keep the same signal seam.
 */
@Component({
  selector: 'app-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <textarea
      class="h-full w-full resize-none bg-transparent text-base leading-relaxed
             text-parchment placeholder:text-parchment-dim/50 outline-none"
      placeholder="Jot a thought…"
      [value]="text()"
      (input)="save($any($event.target).value)"
    ></textarea>
  `,
})
export class NotesWidget {
  readonly text = signal(localStorage.getItem(STORAGE_KEY) ?? '');

  save(value: string): void {
    this.text.set(value);
    localStorage.setItem(STORAGE_KEY, value);
  }
}
