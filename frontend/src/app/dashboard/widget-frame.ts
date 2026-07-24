import { CdkDrag, CdkDragEnd, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ClockWidget } from '../widgets/clock';
import { NotesWidget } from '../widgets/notes';
import { QuoteWidget } from '../widgets/quote';
import { SpotifyWidget } from '../widgets/spotify.widget';
import { WeatherWidget } from '../widgets/weather';
import { CornerFlourish } from './corner-flourish';
import { SpecimenArt } from './specimen-art';
import { DashboardService, WidgetInstance } from './dashboard.service';
import { WIDGET_META } from './widget-registry';
import { SettingsService } from './settings.service';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      cdkDrag
      cdkDragBoundary=".board-surface"
      class="plate group absolute flex flex-col"
      [attr.data-widget]="widget().type"
      [style.--accent]="meta().accent"
      [style.width.px]="meta().width"
      [style.height.px]="meta().height"
      [cdkDragFreeDragPosition]="{ x: widget().x, y: widget().y }"
      [cdkDragDisabled]="widget().pinned"
      (cdkDragEnded)="onDragEnded($event)"
    >
      <!-- winding-flower corners -->
      <app-corner-flourish class="flourish tl" />
      <app-corner-flourish class="flourish tr" />
      <app-corner-flourish class="flourish br" />
      <app-corner-flourish class="flourish bl" />

      @if (settings.theme() === 'mushroom') {
        <app-specimen-art [art]="meta().art" class="watermark" />
      }

      <!-- crown: emblem + drag handle + hover controls -->
      <div cdkDragHandle class="crown relative z-10" [class.cursor-move]="!widget().pinned">
        @if (settings.theme() === 'mushroom') {
          <app-specimen-art [art]="meta().art" class="emblem" />
        } @else {
          <span class="theme-emblem" aria-hidden="true">{{ meta().icon }}</span>
        }
        <div class="controls">
          <button
            [class.text-parchment-dim]="!widget().pinned"
            [style.color]="widget().pinned ? meta().accent : null"
            [title]="widget().pinned ? 'Unpin' : 'Pin in place'"
            (click)="dash.togglePin(widget().type)"
          >
            {{ widget().pinned ? '❁' : '❋' }}
          </button>
          <button class="text-parchment-dim hover:text-cap" title="Remove" (click)="dash.remove(widget().type)">
            ×
          </button>
        </div>
      </div>

      <!-- specimen body -->
      <div class="relative z-10 min-h-0 flex-1 overflow-auto px-4">
        @switch (widget().type) {
          @case ('clock') { <app-clock /> }
          @case ('weather') { <app-weather /> }
          @case ('quote') { <app-quote /> }
          @case ('notes') { <app-notes /> }
          @case ('spotify') { <app-spotify /> }
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
  `,
  styles: [
    `
      .plate {
        isolation: isolate;
        border-radius: var(--frame-radius);
        background: var(--frame-bg);
        border: 1px solid var(--frame-border);
        box-shadow: var(--frame-shadow);
        backdrop-filter: var(--frame-backdrop);
        color: var(--theme-text);
        font-family: var(--theme-font-body);
        transition: border-radius .35s ease, background .35s ease, border-color .25s ease, box-shadow .35s ease;
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
      .controls {
        position: absolute;
        top: 4px;
        right: 8px;
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.2s ease;
        font-size: 14px;
        line-height: 1;
      }
      .group:hover .controls { opacity: 1; }
      .controls button { cursor: pointer; }

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
  readonly meta = computed(() => WIDGET_META[this.widget().type]);

  onDragEnded(event: CdkDragEnd): void {
    const p = event.source.getFreeDragPosition();
    this.dash.move(this.widget().type, p.x, p.y);
  }
}
