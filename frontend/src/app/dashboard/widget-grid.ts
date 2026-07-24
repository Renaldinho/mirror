import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { WIDGETS } from './widget-registry';

/**
 * The widget picker: a small botanical opener that expands into a grid of tiles,
 * and fully collapses back to just the opener (clean mirror). Each tile toggles
 * its widget on/off the board and glows in that widget's accent when active.
 */
@Component({
  selector: 'app-widget-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed left-4 top-4 z-20 flex flex-col items-start gap-2">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40
               bg-wine/80 text-lg text-gold shadow-lg backdrop-blur-sm transition
               hover:bg-gold/10"
        (click)="open.set(!open())"
        [title]="open() ? 'Collapse' : 'Widgets'"
      >
        {{ open() ? '✕' : '❦' }}
      </button>

      @if (open()) {
        <div
          class="grid w-56 grid-cols-2 gap-2 rounded-sm border border-gold/30 bg-wine/85 p-2
                 shadow-2xl shadow-black/60 backdrop-blur-sm"
        >
          @for (w of widgets; track w.type) {
            <button
              class="tile flex flex-col items-center gap-1 rounded-sm border px-2 py-3 transition"
              [style.border-color]="dash.isActive(w.type) ? w.accent : 'rgba(173,165,147,0.18)'"
              [style.background]="dash.isActive(w.type) ? tint(w.accent) : 'transparent'"
              (click)="dash.toggle(w.type)"
              [title]="dash.isActive(w.type) ? 'Remove ' + w.label : 'Add ' + w.label"
            >
              <span class="text-xl" [style.color]="w.accent">{{ w.icon }}</span>
              <span
                class="text-[11px] uppercase tracking-[0.15em]"
                [class.text-parchment]="dash.isActive(w.type)"
                [class.text-parchment-dim]="!dash.isActive(w.type)"
              >
                {{ w.label }}
              </span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`.tile:hover { background: rgba(255, 255, 255, 0.04); }`],
})
export class WidgetGrid {
  readonly dash = inject(DashboardService);
  readonly widgets = WIDGETS;
  readonly open = signal(true);

  /** translucent wash of an accent for the active tile background. */
  tint(hex: string): string {
    return `color-mix(in srgb, ${hex} 16%, transparent)`;
  }
}
