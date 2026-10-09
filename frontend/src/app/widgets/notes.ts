import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { NotesService } from './notes.service';
import { SettingsService } from '../dashboard/settings.service';
import { themeFlavor } from '../dashboard/theme-flavor';
import { UiIcon } from '../shared/ui-icon';

/**
 * A parchment scratchpad persisted through the local .NET API, with a browser
 * cache for temporary backend outages. Toggles between free text and a simple
 * checkable to-do list; both share the same stored document.
 */
@Component({
  selector: 'app-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <div class="notes">
      <div class="modes" role="group" aria-label="Note mode">
        <button
          type="button"
          [class.active]="notes.mode() === 'text'"
          [attr.aria-pressed]="notes.mode() === 'text'"
          title="Free text"
          (click)="notes.setMode('text')"
        >
          <app-ui-icon name="note" />
        </button>
        <button
          type="button"
          [class.active]="notes.mode() === 'list'"
          [attr.aria-pressed]="notes.mode() === 'list'"
          title="Checklist"
          (click)="notes.setMode('list')"
        >
          <app-ui-icon name="check" />
        </button>
      </div>

      @if (notes.mode() === 'text') {
        <textarea
          class="pad"
          maxlength="10000"
          [placeholder]="flavor().notesPlaceholder"
          [value]="notes.text()"
          (input)="notes.edit($any($event.target).value)"
        ></textarea>
      } @else {
        <div class="list">
          <div class="rows" cdkDropList (cdkDropListDropped)="drop($event)">
            @for (item of notes.items(); track item.id) {
              <div class="row" [class.done]="item.done" cdkDrag cdkDragLockAxis="y">
                <span class="drag" cdkDragHandle aria-hidden="true" title="Drag to reorder">
                  <app-ui-icon name="grip" />
                </span>
                <button
                  type="button"
                  class="box"
                  role="checkbox"
                  [attr.aria-checked]="item.done"
                  [attr.aria-label]="(item.done ? 'Uncheck ' : 'Check ') + item.text"
                  (click)="notes.toggleItem(item.id)"
                >
                  @if (item.done) { <app-ui-icon name="check" /> }
                </button>
                <input
                  class="item-text"
                  [value]="item.text"
                  (input)="notes.editItem(item.id, $any($event.target).value)"
                />
                <button
                  type="button"
                  class="del"
                  [attr.aria-label]="'Delete ' + item.text"
                  title="Delete"
                  (click)="notes.removeItem(item.id)"
                >
                  <app-ui-icon name="close" />
                </button>
              </div>
            }
          </div>
          <input
            class="add"
            [placeholder]="flavor().addItem"
            (keydown.enter)="add($any($event.target))"
          />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .notes { display: flex; height: 100%; flex-direction: column; gap: 6px; }
      .modes { display: flex; justify-content: flex-end; gap: 4px; }
      .modes button {
        display: grid; place-items: center; width: 24px; height: 24px; padding: 0;
        border: 1px solid transparent; border-radius: var(--control-radius);
        background: none; color: var(--theme-text-muted); font-size: 15px; cursor: pointer;
      }
      .modes button.active {
        color: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 40%, transparent);
        background: var(--theme-surface-soft);
      }
      .pad {
        flex: 1; width: 100%; resize: none; background: transparent; outline: none; border: none;
        color: var(--theme-text); font-size: 15px; line-height: 1.6;
      }
      .pad::placeholder { color: color-mix(in srgb, var(--theme-text-muted) 65%, transparent); }
      .list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
      .rows { display: flex; flex-direction: column; gap: 4px; }
      .row { display: flex; align-items: center; gap: 6px; background: var(--theme-bg); }
      .row.cdk-drag-preview { border-radius: var(--control-radius); box-shadow: var(--theme-shadow-soft); padding: 2px 6px; }
      .row.cdk-drag-placeholder { opacity: 0.35; }
      .cdk-drag-animating { transition: transform 0.2s cubic-bezier(0, 0, 0.2, 1); }
      .rows.cdk-drop-list-dragging .row:not(.cdk-drag-placeholder) { transition: transform 0.2s cubic-bezier(0, 0, 0.2, 1); }
      .drag {
        flex: none; display: grid; place-items: center; width: 16px; height: 20px;
        color: var(--theme-text-muted); opacity: 0.35; cursor: grab; font-size: 13px;
        transition: opacity 0.15s ease;
      }
      .row:hover .drag, .row:focus-within .drag { opacity: 0.7; }
      .drag:active { cursor: grabbing; }
      .row .del { opacity: 0; }
      .row:hover .del, .row:focus-within .del { opacity: 1; }
      .box {
        flex: none; display: grid; place-items: center; width: 18px; height: 18px; padding: 0;
        border: 1.5px solid var(--theme-border-strong); border-radius: calc(var(--control-radius) * 0.5);
        background: var(--theme-control-bg); color: var(--accent); cursor: pointer; font-size: 13px;
      }
      .row.done .box { background: color-mix(in srgb, var(--accent) 22%, transparent); border-color: var(--accent); }
      .item-text {
        flex: 1; min-width: 0; background: transparent; border: none; outline: none;
        color: var(--theme-text); font-size: 14px; line-height: 1.4;
      }
      .row.done .item-text { color: var(--theme-text-muted); text-decoration: line-through; }
      .del {
        flex: none; display: grid; place-items: center; width: 20px; height: 20px; padding: 0;
        border: none; background: none; color: var(--theme-text-muted); cursor: pointer; font-size: 13px;
        transition: opacity 0.15s ease, color 0.15s ease;
      }
      .del:hover { color: var(--theme-danger); }
      .add {
        width: 100%; margin-top: 2px; background: transparent; border: none; outline: none;
        color: var(--theme-text); font-size: 14px; line-height: 1.4; padding: 2px 0 2px 46px;
      }
      .add::placeholder { color: color-mix(in srgb, var(--theme-text-muted) 65%, transparent); }
    `,
  ],
})
export class NotesWidget {
  readonly notes = inject(NotesService);
  private readonly settings = inject(SettingsService);
  readonly flavor = computed(() => themeFlavor(this.settings.theme()));

  add(input: HTMLInputElement): void {
    this.notes.addItem(input.value);
    input.value = '';
  }

  drop(event: CdkDragDrop<unknown>): void {
    this.notes.reorder(event.previousIndex, event.currentIndex);
  }
}
