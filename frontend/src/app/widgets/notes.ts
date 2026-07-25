import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotesService } from './notes.service';

/**
 * A parchment scratchpad. Text is synced across devices by NotesService (REST +
 * WebSocket through the .NET backend), with a localStorage cache for offline.
 */
@Component({
  selector: 'app-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <textarea
      class="h-full w-full resize-none bg-transparent text-base leading-relaxed
             text-parchment placeholder:text-parchment-dim/50 outline-none"
      placeholder="Jot a thought…"
      [value]="notes.text()"
      (input)="notes.edit($any($event.target).value)"
    ></textarea>
  `,
})
export class NotesWidget {
  readonly notes = inject(NotesService);
}
