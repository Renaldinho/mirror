import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ClockWidget } from '../widgets/clock';
import { NotesWidget } from '../widgets/notes';
import { QuoteWidget } from '../widgets/quote';
import { SpotifyWidget } from '../widgets/spotify.widget';
import { WeatherWidget } from '../widgets/weather';
import { CornerFlourish } from './corner-flourish';
import { DashboardService, WidgetInstance } from './dashboard.service';
import { WIDGET_META } from './widget-registry';

/**
 * Botanical card chrome around a widget: draggable by its title bar (body stays
 * interactive), pinnable, closable. Each widget carries its own accent color
 * (`--accent`) which tints the ornate border, the four winding-flower corner
 * flourishes, and a big faint watermark — so widgets are visually distinct.
 */
@Component({
  selector: 'app-widget-frame',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CornerFlourish,
    ClockWidget,
    WeatherWidget,
    QuoteWidget,
    NotesWidget,
    SpotifyWidget,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      cdkDrag
      cdkDragBoundary=".board-surface"
      class="card absolute flex flex-col"
      [style.--accent]="meta().accent"
      [style.width.px]="meta().width"
      [style.height.px]="meta().height"
      [cdkDragFreeDragPosition]="{ x: widget().x, y: widget().y }"
      [cdkDragDisabled]="widget().pinned"
      (cdkDragEnded)="onDragEnded($event)"
    >
      <!-- big faint botanical watermark (per-widget identity) -->
      <span class="watermark">{{ meta().motif }}</span>

      <!-- four winding-flower corners, tinted by accent -->
      <app-corner-flourish class="flourish tl" />
      <app-corner-flourish class="flourish tr" />
      <app-corner-flourish class="flourish br" />
      <app-corner-flourish class="flourish bl" />

      <!-- title bar / drag handle -->
      <div
        cdkDragHandle
        class="title relative z-10 flex items-center gap-2 px-3 py-1.5"
        [class.cursor-move]="!widget().pinned"
      >
        <span class="accent-text">{{ meta().icon }}</span>
        <span class="flex-1 truncate text-sm uppercase tracking-[0.25em] text-parchment">
          {{ meta().label }}
        </span>
        <button
          class="text-xs leading-none"
          [class.accent-text]="widget().pinned"
          [class.text-parchment-dim]="!widget().pinned"
          [title]="widget().pinned ? 'Unpin' : 'Pin in place'"
          (click)="dash.togglePin(widget().type)"
        >
          {{ widget().pinned ? '❁' : '❋' }}
        </button>
        <button
          class="text-base leading-none text-parchment-dim hover:text-cap"
          title="Remove"
          (click)="dash.remove(widget().type)"
        >
          ×
        </button>
      </div>

      <!-- body -->
      <div class="relative z-10 min-h-0 flex-1 overflow-auto p-3">
        @switch (widget().type) {
          @case ('clock') { <app-clock /> }
          @case ('weather') { <app-weather /> }
          @case ('quote') { <app-quote /> }
          @case ('notes') { <app-notes /> }
          @case ('spotify') { <app-spotify /> }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        border-radius: 3px;
        background: color-mix(in srgb, var(--color-wine) 92%, var(--accent) 8%);
        border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent),
          0 14px 40px rgba(0, 0, 0, 0.6),
          inset 0 0 30px color-mix(in srgb, var(--accent) 7%, transparent);
        backdrop-filter: blur(3px);
      }
      .title {
        border-bottom: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
      }
      .accent-text {
        color: var(--accent);
      }
      .watermark {
        position: absolute;
        right: 6px;
        bottom: 2px;
        font-size: 96px;
        line-height: 1;
        color: var(--accent);
        opacity: 0.06;
        pointer-events: none;
        user-select: none;
        z-index: 0;
      }
      .flourish {
        position: absolute;
        width: 40px;
        height: 40px;
        color: var(--accent);
        z-index: 5;
        pointer-events: none;
        opacity: 0.85;
      }
      .flourish.tl { top: -3px; left: -3px; }
      .flourish.tr { top: -3px; right: -3px; transform: rotate(90deg); }
      .flourish.br { bottom: -3px; right: -3px; transform: rotate(180deg); }
      .flourish.bl { bottom: -3px; left: -3px; transform: rotate(270deg); }
    `,
  ],
})
export class WidgetFrame {
  readonly widget = input.required<WidgetInstance>();
  readonly dash = inject(DashboardService);
  readonly meta = computed(() => WIDGET_META[this.widget().type]);

  onDragEnded(event: CdkDragEnd): void {
    const p = event.source.getFreeDragPosition();
    this.dash.move(this.widget().type, p.x, p.y);
  }
}
