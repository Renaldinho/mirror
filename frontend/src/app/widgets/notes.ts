import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotesService } from './notes.service';

/**
 * A parchment scratchpad persisted through the local .NET API, with a browser
 * cache for temporary backend outages.
 */
@Component({
  selector: 'app-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <textarea
      class="h-full w-full resize-none bg-transparent text-base leading-relaxed
             text-parchment placeholder:text-parchment-dim/50 outline-none"
      maxlength="10000"
      placeholder="Jot a thought…"
      [value]="notes.text()"
      (input)="notes.edit($any($event.target).value)"
    ></textarea>
  `,
})
export class NotesWidget {
  readonly notes = inject(NotesService);
}
