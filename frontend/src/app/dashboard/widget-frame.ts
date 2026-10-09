import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ClockWidget } from '../widgets/clock';
import { NotesWidget } from '../widgets/notes';
import { QuoteWidget } from '../widgets/quote';
import { SpotifyWidget } from '../widgets/spotify.widget';
import { LyricsWidget } from '../widgets/lyrics.widget';
import { WeatherWidget } from '../widgets/weather';
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
 * label (common + latin name) at the foot. Dragged by its crown; controls appear
 * on hover to keep the app-feel minimal. Each plate is tinted by its accent.
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
      [style.width.px]="display.portrait() ? layout().width * displayScale() : null"
      [style.height.px]="display.portrait() ? portraitHeight() * displayScale() : null"
      [cdkDragFreeDragPosition]="display.portrait() ? { x: 0, y: 0 } : { x: widget().x, y: widget().y }"
      [cdkDragDisabled]="display.portrait() || widget().pinned"
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
        [style.height.px]="widget().collapsed ? null : layout().height"
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
          cdkDragHandle
          class="crown relative z-10"
          [class.cursor-move]="!display.portrait() && !widget().pinned"
          (dblclick)="onCrownDblClick()"
        >
          @if (!display.portrait() && !widget().pinned) {
            <span class="grip" aria-hidden="true" title="Drag to move"><app-ui-icon name="grip" /></span>
          }
          @if (settings.theme() === 'mushroom') {
            <app-specimen-art [art]="meta().art" class="emblem" />
          } @else {
            <span class="theme-emblem" aria-hidden="true"><app-ui-icon [name]="meta().icon" /></span>
          }
          @if (widget().collapsed && !hasMini()) {
            <span class="crown-name">{{ meta().label }}</span>
          }
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
            @if (!display.portrait()) {
              <button
                [class.text-parchment-dim]="!widget().pinned"
                [style.color]="widget().pinned ? meta().accent : null"
                [title]="widget().pinned ? 'Unpin' : 'Pin in place'"
                (click)="dash.togglePin(widget().type)"
              >
                <app-ui-icon [name]="widget().pinned ? 'pin' : 'pin-off'" />
              </button>
            }
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
        height: auto;
        padding-bottom: 8px;
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
        justify-content: center;
        padding-top: 8px;
        height: 46px;
      }
      .emblem {
        width: 30px;
        height: 30px;
        color: var(--accent);
        opacity: 0.95;
      }
      .theme-emblem {
        display: grid; width: 31px; height: 31px; place-items: center;
        color: var(--accent); font: 600 21px/1 var(--theme-font-display);
        text-shadow: 0 0 14px color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .grip {
        position: absolute;
        top: 50%;
        left: 8px;
        transform: translateY(-50%);
        color: var(--theme-text-muted);
        opacity: 0.5;
        font-size: 13px;
        line-height: 1;
        letter-spacing: -1px;
        pointer-events: none;
      }
      .crown-name {
        margin-left: 8px;
        font-family: var(--theme-font-display);
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--theme-text);
      }
      .controls {
        position: absolute;
        top: 4px;
        right: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.2s ease;
        font-size: 14px;
        line-height: 1;
      }
      .group:hover .controls,
      .group:focus-within .controls,
      .is-collapsed .controls { opacity: 1; }
      .controls button { cursor: pointer; }
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
  /** Portrait rows size to a crown (46) or a taller mini player (108) when collapsed. */
  readonly portraitHeight = computed(() => {
    if (!this.widget().collapsed) return this.layout().height;
    return MINI_COLLAPSE.has(this.widget().type) ? 108 : 46;
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
    const p = event.source.getFreeDragPosition();
    this.dash.move(this.widget().type, p.x, p.y);
  }
}
