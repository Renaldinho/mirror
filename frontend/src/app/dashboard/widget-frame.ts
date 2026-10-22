import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';
import { ClockWidget } from '../widgets/clock';
import { NotesWidget } from '../widgets/notes';
import { QuoteWidget } from '../widgets/quote';
import { SpotifyWidget } from '../widgets/spotify.widget';
import { LyricsWidget } from '../widgets/lyrics.widget';
import { WeatherWidget } from '../widgets/weather';
import { AlarmWidget } from '../widgets/alarm.widget';
import { CornerFlourish } from './corner-flourish';
import { SpecimenArt } from './specimen-art';
import { DashboardService, SCALE_STEPS, WidgetInstance } from './dashboard.service';
import { MINI_COLLAPSE, WIDGET_META } from './widget-registry';
import { SettingsService } from './settings.service';
import { UiIcon } from '../shared/ui-icon';
import { DisplayService } from './display.service';

/**
 * A pressed-botanical "specimen plate": an arched frosted-glass sheet (so the
 * mirror backlight glows through), a small illustrated emblem crowning the arch,
 * a large faint botanical watermark, winding-flower corners, and a herbarium
 * label (common + latin name) at the foot. A dedicated crown handle moves it;
 * the adjacent controls stay clickable. Each plate is tinted by its accent.
 */
@Component({
  selector: 'app-widget-frame',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CornerFlourish,
    SpecimenArt,
    ClockWidget,
    WeatherWidget,
    QuoteWidget,
    NotesWidget,
    SpotifyWidget,
    LyricsWidget,
    AlarmWidget,
    UiIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- anchor carries only CDK's drag translate; the plate carries scale + visuals -->
    <div
      cdkDrag
      cdkDragBoundary=".board-surface"
      class="anchor absolute"
      [class.portrait]="display.portrait()"
      [style.width.px]="layout().width * displayScale()"
      [style.height.px]="portraitHeight() * displayScale()"
      [cdkDragFreeDragPosition]="display.portrait() ? { x: 0, y: 0 } : { x: widget().x, y: widget().y }"
      [cdkDragDisabled]="widget().pinned"
      [cdkDragStartDelay]="{ mouse: 0, touch: 120 }"
      (cdkDragEnded)="onDragEnded($event)"
    >
      <div
        class="plate group flex flex-col"
        [class.is-collapsed]="widget().collapsed"
        [class.has-mini]="hasMini()"
        [attr.data-widget]="widget().type"
        [attr.data-variant]="layout().id"
        [style.--accent]="meta().accent"
        [style.width.px]="layout().width"
        [style.height.px]="portraitHeight()"
        [style.transform]="'scale(' + displayScale() + ')'"
      >
        <!-- winding-flower corners -->
        <app-corner-flourish class="flourish tl" />
        <app-corner-flourish class="flourish tr" />
        <app-corner-flourish class="flourish br" />
        <app-corner-flourish class="flourish bl" />

        @if (settings.theme() === 'mushroom') {
          <app-specimen-art [art]="meta().art" class="watermark" />
        }

        <!-- crown: emblem + drag handle + hover controls; double-click to collapse -->
        <div
          class="crown relative z-10"
          (dblclick)="onCrownDblClick()"
        >
          <button type="button" cdkDragHandle class="drag-handle" [disabled]="widget().pinned"
            [attr.aria-label]="(display.portrait() ? 'Reorder ' : 'Move ') + meta().label"
            [title]="widget().pinned ? 'Pinned: unpin to move' : display.portrait() ? 'Drag onto another widget to reorder. Alt + arrows also works.' : 'Drag to move'"
            (keydown)="onHandleKeydown($event)">
            <app-ui-icon [name]="widget().pinned ? 'pin' : 'grip'" />
            @if (widget().collapsed && !hasMini()) { <span class="crown-name">{{ meta().label }}</span> }
          </button>
          <div class="controls" (dblclick)="$event.stopPropagation()">
            <span class="scaler">
              <button
                class="text-parchment-dim hover:text-cap"
                title="Scale down"
                [attr.aria-label]="'Scale ' + meta().label + ' down'"
                [disabled]="atMinScale()"
                (click)="dash.setScale(widget().type, -1)"
              >
                −
              </button>
              <span class="pct">{{ scalePercent() }}%</span>
              <button
                class="text-parchment-dim hover:text-cap"
                title="Scale up"
                [attr.aria-label]="'Scale ' + meta().label + ' up'"
                [disabled]="atMaxScale()"
                (click)="dash.setScale(widget().type, 1)"
              >
                +
              </button>
            </span>
            @if (canCollapse() || widget().collapsed) {
              <button
                class="text-parchment-dim hover:text-cap"
                [title]="widget().collapsed ? 'Expand' : 'Collapse'"
                [attr.aria-label]="(widget().collapsed ? 'Expand ' : 'Collapse ') + meta().label"
                (click)="dash.toggleCollapse(widget().type)"
              >
                <app-ui-icon [name]="widget().collapsed ? 'chevron-right' : 'chevron-down'" />
              </button>
            }
            @if (meta().layouts.length > 1) {
              <button
                class="text-parchment-dim hover:text-cap"
                [title]="'Change layout · ' + layout().label"
                [attr.aria-label]="'Change ' + meta().label + ' layout. Current: ' + layout().label"
                (click)="dash.cycleVariant(widget().type)"
              >
                <app-ui-icon name="layout" />
              </button>
            }
              <button
                type="button"
                [class.text-parchment-dim]="!widget().pinned"
                [style.color]="widget().pinned ? meta().accent : null"
                [title]="widget().pinned ? 'Unpin' : 'Pin in place'"
                [attr.aria-label]="(widget().pinned ? 'Unpin ' : 'Pin ') + meta().label"
                [attr.aria-pressed]="widget().pinned"
                (click)="dash.togglePin(widget().type)"
              >
                <app-ui-icon [name]="widget().pinned ? 'pin' : 'pin-off'" />
              </button>
            <button class="text-parchment-dim hover:text-cap" title="Remove" (click)="dash.remove(widget().type)">
              <app-ui-icon name="close" />
            </button>
          </div>
        </div>

        <!-- specimen body -->
        <div class="widget-body relative z-10 min-h-0 flex-1 overflow-hidden px-4">
          @switch (widget().type) {
            @case ('clock') { <app-clock [variant]="layout().id" /> }
            @case ('weather') { <app-weather [variant]="layout().id" /> }
            @case ('quote') { <app-quote /> }
            @case ('notes') { <app-notes /> }
            @case ('spotify') { <app-spotify [collapsed]="widget().collapsed" /> }
            @case ('lyrics') { <app-lyrics [collapsed]="widget().collapsed" /> }
            @case ('alarm') { <app-alarm [collapsed]="widget().collapsed" /> }
          }
        </div>

        <!-- herbarium label -->
        <div class="label relative z-10">
          <span class="rule"></span>
          <div class="names">
            <span class="common">{{ meta().label }}</span>
            <span class="latin">{{ meta().latin }}</span>
          </div>
          <span class="rule"></span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .anchor {
        /* sizes to the plate so CDK's drag boundary tracks the widget box */
        width: max-content;
      }
      .anchor.portrait { position: relative; }
      .anchor.cdk-drag-dragging { z-index: 50; }
      .portrait .plate { position: absolute; top: 0; left: 0; }
      .plate {
        position: relative;
        transform-origin: top left;
        isolation: isolate;
        border-radius: var(--frame-radius);
        background: var(--frame-bg);
        border: 1px solid var(--frame-border);
        box-shadow: var(--frame-shadow);
        backdrop-filter: none;
        color: var(--theme-text);
        font-family: var(--theme-font-body);
        transition: border-radius .35s ease, background .35s ease, border-color .25s ease,
          box-shadow .35s ease, height .3s ease;
        /* Gentle entrance. Opacity only — the inline scale owns transform. */
        animation: plate-in .4s ease both;
      }
      @keyframes plate-in { from { opacity: 0; } to { opacity: 1; } }
      /* Hover lift reads through shadow + border rather than transform. */
      .plate:hover {
        border-color: color-mix(in srgb, var(--accent) 45%, var(--frame-border));
        box-shadow: var(--frame-shadow), 0 10px 30px color-mix(in srgb, var(--accent) 22%, transparent);
      }
      .plate.is-collapsed .label,
      .plate.is-collapsed .watermark {
        display: none;
      }
      /* Most widgets hide their body entirely; mini-capable ones keep a
         compact view (see .plate.has-mini). */
      .plate.is-collapsed:not(.has-mini) .widget-body {
        display: none;
      }
      .plate.is-collapsed.has-mini .widget-body {
        padding-bottom: 8px;
      }
      .plate.is-collapsed .crown {
        height: 46px;
      }
      .plate::before,
      .plate::after {
        content: '';
        position: absolute;
        z-index: 1;
        pointer-events: none;
        transition: .35s ease;
      }
      .plate::before {
        inset: 6px;
        border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
        border-radius: inherit;
      }
      .plate::after {
        inset: 18% 14% 18%;
        opacity: .12;
      }

      .flourish {
        position: absolute;
        width: 46px;
        height: 46px;
        color: var(--accent);
        z-index: 6;
        pointer-events: none;
        opacity: 0.9;
      }
      .flourish.tl { top: 2px; left: -4px; }
      .flourish.tr { top: 2px; right: -4px; transform: rotate(90deg); }
      .flourish.br { bottom: -4px; right: -4px; transform: rotate(180deg); }
      .flourish.bl { bottom: -4px; left: -4px; transform: rotate(270deg); }

      .watermark {
        position: absolute;
        inset: 22% 12% 12% 12%;
        color: var(--accent);
        opacity: 0.1;
        pointer-events: none;
        z-index: 0;
      }

      .crown {
        display: flex;
        align-items: center;
        gap: 4px; padding: 4px 8px; height: 46px; flex-shrink: 0; box-sizing: border-box;
      }
      .drag-handle {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        flex: 1; min-width: 44px; height: 38px; padding: 0 4px;
        border: 1px solid transparent; border-radius: var(--control-radius);
        background: transparent; color: var(--theme-text-muted); cursor: grab;
        touch-action: none; user-select: none;
      }
      .drag-handle app-ui-icon { font-size: 20px; }
      .drag-handle:hover:not(:disabled) { color: var(--accent); background: var(--theme-surface-hover); border-color: var(--theme-border); }
      .drag-handle:active:not(:disabled) { cursor: grabbing; }
      .drag-handle:disabled { cursor: default; }
      .crown-name {
        font-family: var(--theme-font-display);
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--theme-text);
      }
      .controls {
        display: flex;
        align-items: center;
        flex-shrink: 0; gap: 4px;
        opacity: .8;
        transition: opacity 0.2s ease;
        font-size: 14px;
        line-height: 1;
      }
      .group:hover .controls,
      .group:focus-within .controls,
      .is-collapsed .controls { opacity: 1; }
      .controls button { display: grid; place-items: center; min-width: 24px; min-height: 28px; cursor: pointer; }
      .controls button:hover:not(:disabled) { color: var(--accent); background: var(--theme-surface-hover); }
      .controls button:disabled {
        opacity: 0.3;
        cursor: default;
      }
      .scaler {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .scaler .pct {
        min-width: 30px;
        text-align: center;
        font-size: 10px;
        letter-spacing: 0.04em;
        color: var(--theme-text-muted);
        font-variant-numeric: tabular-nums;
      }

      .label {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px 12px;
      }
      .label .rule {
        flex: 1;
        height: 1px;
        background: linear-gradient(to right, transparent, color-mix(in srgb, var(--accent) 55%, transparent), transparent);
      }
      .names {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.1;
      }
      .common {
        font-size: 11px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--theme-text);
        font-family: var(--theme-font-display);
      }
      .latin {
        font-style: italic;
        font-size: 11px;
        color: color-mix(in srgb, var(--accent) 70%, var(--theme-text-muted));
      }

    `,
  ],
})
export class WidgetFrame {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly widget = input.required<WidgetInstance>();
  readonly dash = inject(DashboardService);
  readonly settings = inject(SettingsService);
  readonly display = inject(DisplayService);
  readonly meta = computed(() => WIDGET_META[this.widget().type]);
  readonly layout = computed(
    () =>
      this.meta().layouts.find((layout) => layout.id === this.widget().variant) ??
      this.meta().layouts[0],
  );
  readonly displayScale = computed(() => {
    if (!this.display.portrait()) return this.widget().scale;
    const cell = this.display.cellSize(this.dash.widgets().length);
    // Leave room for ornamental corners and a scrollbar on shorter screens.
    const width = cell.width - 16;
    const height = cell.height - 16;
    const base = Math.min(3, width / 360, height / 360);
    return Math.min(base * this.widget().scale, width / this.layout().width, height / this.layout().height);
  });
  /** Collapsing only makes sense where it still shows something (a mini view). */
  readonly canCollapse = computed(() => MINI_COLLAPSE.has(this.widget().type));
  /** True once the widget is collapsed AND its type renders a compact view. */
  readonly hasMini = computed(() => this.widget().collapsed && MINI_COLLAPSE.has(this.widget().type));
  /** The visible card height, including a compact crown or mini player. */
  readonly portraitHeight = computed(() => {
    if (!this.widget().collapsed) return this.layout().height;
    return MINI_COLLAPSE.has(this.widget().type) ? 108 : 48;
  });
  readonly scalePercent = computed(() => Math.round(this.displayScale() * 100));
  readonly atMinScale = computed(() => this.widget().scale <= SCALE_STEPS[0]);
  readonly atMaxScale = computed(() => this.widget().scale >= SCALE_STEPS[SCALE_STEPS.length - 1]);

  /** Double-click collapses only when meaningful; always allows re-expanding. */
  onCrownDblClick(): void {
    if (this.canCollapse() || this.widget().collapsed) {
      this.dash.toggleCollapse(this.widget().type);
    }
  }

  onDragEnded(event: CdkDragEnd): void {
    if (this.display.portrait()) {
      this.reorderAt(event.dropPoint.x, event.dropPoint.y);
      event.source.reset();
      return;
    }
    const p = event.source.getFreeDragPosition();
    this.dash.move(this.widget().type, p.x, p.y);
  }

  onHandleKeydown(event: KeyboardEvent): void {
    if (!event.altKey || this.widget().pinned) return;
    const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowUp' ? -this.display.columns() : event.key === 'ArrowDown' ? this.display.columns() : 0;
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    if (this.display.portrait()) {
      const widgets = this.dash.widgets();
      const index = widgets.findIndex((widget) => widget.type === this.widget().type);
      const target = widgets[index + direction];
      if (target) this.dash.reorder(this.widget().type, target.type);
    } else {
      const dx = event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0;
      const dy = event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0;
      const bounds = this.element.nativeElement.closest('.board-surface')?.getBoundingClientRect();
      const x = this.widget().x + dx;
      const y = this.widget().y + dy;
      this.dash.move(this.widget().type,
        bounds ? Math.min(x, Math.max(0, bounds.width - this.layout().width * this.displayScale())) : x,
        bounds ? Math.min(y, Math.max(0, bounds.height - this.portraitHeight() * this.displayScale())) : y);
    }
  }

  private reorderAt(x: number, y: number): void {
    const board = this.element.nativeElement.closest('.widget-board');
    if (!board) return;
    const bounds = board.getBoundingClientRect();
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return;
    let closest = this.widget().type;
    let distance = Infinity;
    for (const frame of board.querySelectorAll<HTMLElement>(':scope > app-widget-frame')) {
      const rect = frame.getBoundingClientRect();
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      const nextDistance = inside ? 0 : Math.hypot(x - (rect.left + rect.right) / 2, y - (rect.top + rect.bottom) / 2);
      if (nextDistance < distance) {
        const type = frame.getAttribute('data-widget');
        if (this.dash.widgets().some((widget) => widget.type === type)) {
          closest = type as WidgetInstance['type'];
          distance = nextDistance;
        }
      }
    }
    this.dash.reorder(this.widget().type, closest);
  }
}
