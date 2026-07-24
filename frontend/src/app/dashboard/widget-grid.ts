import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { PetService, PETS } from './pet.service';
import { PetMoodService } from './pets/pet-mood.service';
import { PetSpriteSheet } from './pets/pet-types';
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
        class="cabinet-trigger flex h-10 w-10 items-center justify-center rounded-full border border-gold/40
               bg-wine/80 text-lg text-gold shadow-lg backdrop-blur-sm transition
               hover:bg-gold/10"
        (click)="open.set(!open())"
        [title]="open() ? 'Collapse' : 'Widgets'"
      >
        {{ open() ? '×' : '◈' }}
      </button>

      @if (open()) {
        <div
          class="cabinet-panel grid w-56 grid-cols-2 gap-2 border border-gold/30 bg-wine/85 p-2
                 shadow-2xl shadow-black/60 backdrop-blur-sm"
        >
          @for (w of widgets; track w.type) {
            <button
              class="tile flex flex-col items-center gap-1 rounded-sm border px-2 py-3 transition"
              [style.border-color]="dash.isActive(w.type) ? w.accent : 'var(--theme-border)'"
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

        <!-- desktop pet picker -->
        <div class="cabinet-panel mt-2 w-56 border border-gold/30 bg-wine/85 p-2 backdrop-blur-sm shadow-2xl shadow-black/60">
          <div class="mb-1 px-1 text-[10px] uppercase tracking-[0.2em] text-parchment-dim">Companion</div>
          <div class="grid grid-cols-4 gap-1">
            @for (p of pets; track p.id) {
              <button
                class="companion flex h-12 items-center justify-center overflow-hidden rounded-sm border text-lg transition"
                [style.border-color]="pet.petId() === p.id ? 'var(--theme-primary)' : 'var(--theme-border)'"
                [style.background]="pet.petId() === p.id ? 'var(--theme-primary-soft)' : 'transparent'"
                (click)="pet.select(p.id)"
                [title]="(pet.petId() === p.id ? 'Dismiss ' : '') + p.label + ' — ' + p.description"
              >
                <span
                  [class]="'pet-preview ' + p.sprite.cssClass"
                  [style.background-size]="spriteSize(p.sprite)"
                ></span>
              </button>
            }
          </div>

          @if (pet.petId()) {
            <div class="mt-2 flex flex-col gap-1.5">
              <input
                class="name-field px-2 py-1 text-[11px]"
                [value]="mood.name()"
                (input)="mood.setName($any($event.target).value)"
                placeholder="name your companion…"
                aria-label="Companion name"
                maxlength="24"
              />
              <div
                class="energy"
                role="meter"
                aria-label="Companion energy"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-valuenow]="round(mood.energy())"
              >
                <div class="energy-fill" [style.width.%]="mood.energy()"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .cabinet-panel {
        border-radius: var(--panel-radius);
        background: var(--theme-panel);
        border-color: var(--theme-border-strong);
        box-shadow: var(--theme-shadow-strong);
      }
      .cabinet-trigger { border-radius: var(--control-radius); background: var(--theme-panel); box-shadow: var(--theme-shadow-soft); }
      .tile, .companion { border-radius: var(--control-radius); }
      .tile:hover { background: var(--theme-surface-hover); }
      .companion:hover { background: var(--theme-surface-hover) !important; }
      .pet-preview {
        display: block;
        width: 38px;
        height: 41px;
        flex: none;
        background-position: left top;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.45));
      }
      .name-field {
        width: 100%;
        border: 1px solid var(--theme-border);
        border-radius: var(--control-radius);
        background: var(--theme-control-bg);
        color: var(--theme-text);
        letter-spacing: 0.04em;
      }
      .energy {
        height: 5px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--theme-surface-soft);
      }
      .energy-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-bright));
        transition: width 0.4s ease;
      }
    `,
  ],
})
export class WidgetGrid {
  readonly dash = inject(DashboardService);
  readonly pet = inject(PetService);
  readonly mood = inject(PetMoodService);
  readonly widgets = WIDGETS;
  readonly pets = PETS;
  readonly open = signal(true);

  /** translucent wash of an accent for the active tile background. */
  tint(hex: string): string {
    return `color-mix(in srgb, ${hex} 16%, transparent)`;
  }

  spriteSize(sprite: PetSpriteSheet): string {
    return `${sprite.columns * 100}% ${sprite.rows * 100}%`;
  }

  round(value: number): number {
    return Math.round(value);
  }
}
