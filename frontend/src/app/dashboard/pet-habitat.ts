import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { CozyItem, CozyItemType } from './pets/cozy-types';
import {
  COZY_CATALOG,
  COZY_ITEMS,
  PetCozyService,
} from './pets/pet-cozy.service';

@Component({
  selector: 'app-pet-habitat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cozy-back" aria-hidden="true">
      @for (item of cozy.items(); track item.id) {
        <span class="cozy-item" [class]="item.type" [class.off]="item.type === 'tv' && !item.enabled" [style]="itemStyle(item)">
          <i class="body"></i><i class="detail"></i>
        </span>
      }
      @if (preview(); as item) {
        <span class="cozy-item preview" [class]="item.type" [style]="itemStyle(item)">
          <i class="body"></i><i class="detail"></i>
        </span>
      }
    </div>

    <div class="cozy-front" aria-hidden="true">
      @for (item of cozy.items(); track item.id) {
        @if (item.type !== 'tv') {
          <span class="front-piece" [class]="item.type" [style]="itemStyle(item)"></span>
        }
      }
    </div>

    @if (!cozy.editing()) {
      @for (item of cozy.items(); track item.id) {
        @if (item.type === 'tv') {
          <button
            class="tv-toggle"
            type="button"
            [style]="itemStyle(item)"
            [attr.aria-pressed]="item.enabled"
            [title]="item.enabled ? 'Turn tiny TV off' : 'Turn tiny TV on'"
            (click)="cozy.toggleTv()"
          ></button>
        }
      }
    }

    <button
      class="cozy-trigger"
      type="button"
      [class.active]="cozy.editing()"
      [attr.aria-pressed]="cozy.editing()"
      title="Arrange a cozy pet space"
      (click)="toggleEditing()"
    >&#8962;</button>

    @if (cozy.editing()) {
      <div
        class="cozy-canvas"
        role="application"
        aria-label="Cozy pet space"
        (pointermove)="previewNew($event)"
        (pointerleave)="preview.set(null)"
        (pointerdown)="place($event)"
      ></div>

      <section class="cozy-panel" aria-label="Arrange cozy pet space">
        <header>
          <span><small>Pet space</small><strong>Make it cozy</strong></span>
          <button type="button" aria-label="Finish arranging" (click)="finish()">&times;</button>
        </header>
        <div class="palette">
          @for (item of catalog; track item.type) {
            <button
              type="button"
              [class.active]="activeType() === item.type"
              [disabled]="cozy.has(item.type)"
              [title]="cozy.has(item.type) ? item.label + ' is already placed' : 'Place ' + item.label"
              (click)="choose(item.type)"
            ><b>{{ item.glyph }}</b><span>{{ item.label }}</span></button>
          }
        </div>
        <p>{{ message() || 'Place one of each item anywhere in the pet area.' }}</p>
        <div class="actions">
          <button type="button" [disabled]="!cozy.selected()" (click)="remove()">Delete selected</button>
          <button type="button" [disabled]="!cozy.items().length" (click)="clear()">Clear all</button>
        </div>
      </section>

      @for (item of cozy.items(); track item.id) {
        <button
          type="button"
          class="item-hitbox"
          [class.selected]="cozy.selectedId() === item.id"
          [style]="itemStyle(item)"
          [attr.aria-label]="'Select and move ' + definition(item).label"
          (pointerdown)="beginMove($event, item)"
          (click)="cozy.selectedId.set(item.id)"
        ></button>
      }
    }
  `,
  styles: [
    `
      :host { display: contents; }
      .cozy-back,.cozy-front { position: fixed; inset: 0; pointer-events: none; }
      .cozy-back { z-index: 36; }
      .cozy-front { z-index: 44; }
      .cozy-item,.front-piece { position: fixed; display: block; background-position: center; background-size: 100% 100%; background-repeat: no-repeat; image-rendering: pixelated; }
      .body { display: none; }
      .detail { position: absolute; display: none; }
      .tv .detail { display: block; left: 20px; top: 39px; width: 70px; height: 49px; border-radius: 8px; opacity: .72; background: repeating-linear-gradient(0deg,var(--theme-primary) 0 5px,var(--theme-primary-bright) 5px 9px); animation: tv-flicker .8s steps(2) infinite; mix-blend-mode: screen; }
      .tv.off .detail { display: none; }
      .front-piece.bed { clip-path: inset(75% 0 0); }
      .front-piece.cushion { clip-path: inset(68% 0 0); }
      .preview { opacity: .58; filter: drop-shadow(0 0 5px var(--theme-primary-bright)); }
      .cozy-trigger { position: fixed; left: 112px; top: 16px; z-index: 48; display: grid; width: 40px; height: 40px; place-items: center; pointer-events: auto; border: 1px solid var(--theme-border-strong); border-radius: var(--control-radius); background: var(--theme-panel); color: var(--theme-primary); box-shadow: var(--theme-shadow-soft); font-size: 20px; cursor: pointer; }
      .cozy-trigger:hover,.cozy-trigger.active { color: var(--theme-primary-bright); border-color: var(--theme-primary); }
      .tv-toggle { position: fixed; z-index: 45; pointer-events: auto; border: 0; background: transparent; cursor: pointer; }
      .cozy-canvas { position: fixed; inset: 0; z-index: 46; pointer-events: auto; cursor: crosshair; }
      .cozy-panel { position: fixed; left: 164px; top: 16px; z-index: 50; width: min(390px,calc(100vw - 180px)); padding: 12px; pointer-events: auto; border: 1px solid var(--theme-border-strong); border-radius: var(--panel-radius); background: var(--theme-panel-opaque); color: var(--theme-text); box-shadow: var(--theme-shadow-strong); }
      header { display: flex; justify-content: space-between; margin-bottom: 9px; }
      header span { display: flex; flex-direction: column; }
      header small { color: var(--theme-text-muted); font-size: 9px; text-transform: uppercase; }
      header strong { font: 500 18px/1.2 var(--theme-font-display); }
      header button { color: var(--theme-text-muted); font-size: 21px; }
      .palette { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; }
      .palette button { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 7px 3px; border: 1px solid var(--theme-border); border-radius: var(--control-radius); background: var(--theme-surface-soft); color: var(--theme-text-muted); cursor: pointer; }
      .palette button.active { color: var(--theme-primary-bright); border-color: var(--theme-primary); }
      .palette button:disabled { opacity: .35; cursor: not-allowed; }
      .palette b { font-size: 17px; }
      .palette span { font-size: 9px; white-space: nowrap; }
      .cozy-panel p { min-height: 14px; margin: 9px 1px; color: var(--theme-text-muted); font-size: 10px; }
      .actions { display: flex; gap: 6px; }
      .actions button { padding: 5px 9px; border: 1px solid var(--theme-border); background: var(--theme-surface-soft); color: var(--theme-text); font-size: 10px; }
      .actions button:disabled { opacity: .35; }
      .item-hitbox { position: fixed; z-index: 49; pointer-events: auto; border: 1px dashed transparent; background: transparent; cursor: move; }
      .item-hitbox:hover,.item-hitbox.selected { border-color: var(--theme-primary-bright); background: color-mix(in srgb,var(--theme-primary) 10%,transparent); }
      @keyframes tv-flicker { to { filter: brightness(1.25) hue-rotate(14deg); } }
    `,
  ],
})
export class PetHabitat {
  readonly cozy = inject(PetCozyService);
  readonly catalog = COZY_ITEMS;
  readonly activeType = signal<CozyItemType>('bed');
  readonly preview = signal<CozyItem | null>(null);
  readonly message = signal('');

  private drag: { id: string; offsetX: number; offsetY: number } | null = null;

  constructor() {
    this.cozy.initialise(this.bounds());
  }

  toggleEditing(): void {
    if (this.cozy.editing()) this.finish();
    else this.cozy.editing.set(true);
  }

  finish(): void {
    this.drag = null;
    this.preview.set(null);
    this.message.set('');
    this.cozy.selectedId.set(null);
    this.cozy.editing.set(false);
  }

  choose(type: CozyItemType): void {
    if (this.cozy.has(type)) return;
    this.activeType.set(type);
    this.cozy.selectedId.set(null);
    this.message.set('');
  }

  previewNew(event: PointerEvent): void {
    if (this.drag || this.cozy.has(this.activeType())) return;
    const definition = COZY_CATALOG[this.activeType()];
    this.preview.set(this.cozy.preview(
      this.activeType(),
      event.clientX - definition.width / 2,
      event.clientY - definition.height / 2,
      this.bounds(),
    ));
  }

  place(event: PointerEvent): void {
    if (event.button !== 0 || this.drag) return;
    const item = this.preview();
    if (!item) return;
    if (!this.cozy.add(item, this.bounds())) {
      this.message.set(`Only one ${this.definition(item).label.toLowerCase()} can be placed.`);
    } else {
      this.preview.set(null);
      this.message.set('');
    }
  }

  beginMove(event: PointerEvent, item: CozyItem): void {
    if (event.button !== 0) return;
    this.cozy.selectedId.set(item.id);
    this.drag = {
      id: item.id,
      offsetX: event.clientX - item.x,
      offsetY: event.clientY - item.y,
    };
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('window:pointermove', ['$event'])
  moveSelected(event: PointerEvent): void {
    if (!this.drag) return;
    const current = this.cozy.items().find((item) => item.id === this.drag!.id);
    if (!current) return;
    this.preview.set(this.cozy.preview(
      current.type,
      event.clientX - this.drag.offsetX,
      event.clientY - this.drag.offsetY,
      this.bounds(),
      current.id,
    ));
  }

  @HostListener('window:pointerup')
  dropSelected(): void {
    if (!this.drag) return;
    const item = this.preview();
    if (item) this.cozy.move(item.id, item.x, item.y, this.bounds());
    this.drag = null;
    this.preview.set(null);
  }

  remove(): void {
    this.cozy.removeSelected(this.bounds());
    this.message.set('');
  }

  clear(): void {
    if (window.confirm('Remove every cozy pet item?')) this.cozy.clear(this.bounds());
  }

  definition(item: CozyItem) {
    return COZY_CATALOG[item.type];
  }

  itemStyle(item: CozyItem): string {
    const definition = this.definition(item);
    return `left:${item.x}px;top:${item.y}px;width:${definition.width}px;height:${definition.height}px`;
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.cozy.editing()) this.finish();
  }

  @HostListener('window:resize')
  resize(): void {
    this.cozy.resize(this.bounds());
  }

  private bounds() {
    const height = window.innerHeight;
    return {
      width: window.innerWidth,
      height,
      topY: Math.min(height - 64, Math.max(84, height * .16)),
      floorY: height - 64,
    };
  }
}
