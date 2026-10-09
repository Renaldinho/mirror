import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { PetService, PETS } from './pet.service';
import { PetMoodService } from './pets/pet-mood.service';
import { PetCozyService } from './pets/pet-cozy.service';
import { PetSpriteSheet } from './pets/pet-types';
import { SettingsService, CURSOR_FX_MODES } from './settings.service';
import { THEMES } from './theme-registry';
import { WIDGETS } from './widget-registry';
import { IconName, UiIcon } from '../shared/ui-icon';

type Section = 'widgets' | 'companion' | 'theme' | 'effects';

interface Petal {
  id: Section;
  label: string;
  icon: IconName;
}

/**
 * A single ornamental hub that replaces the scattered corner triggers. Tapping
 * the hub fans four petals (Widgets · Companion · Theme · Effects) into an arc;
 * tapping a petal opens that section's controls in a flyout above the hub. One
 * quiet glyph when closed — the mirror stays clean.
 */
@Component({
  selector: 'app-control-hub',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (menuOpen()) {
      <button class="scrim" type="button" aria-label="Close menu" (click)="closeAll()"></button>
    }

    <div class="hub-ring" [class.open]="menuOpen()">
      @for (petal of petals; track petal.id; let i = $index) {
        <button
          class="petal"
          type="button"
          [class.active]="section() === petal.id"
          [style.transform]="menuOpen() ? petalTransform(i) : 'translate(0,0) scale(.4)'"
          [style.transition-delay]="menuOpen() ? (i * 35) + 'ms' : '0ms'"
          [attr.aria-label]="petal.label"
          [attr.aria-expanded]="section() === petal.id"
          [title]="petal.label"
          (click)="openSection(petal.id)"
        >
          <app-ui-icon [name]="petal.id === 'theme' ? themeIcon() : petal.icon" />
          <span class="petal-label">{{ petal.label }}</span>
        </button>
      }

      <button
        class="hub"
        type="button"
        [class.on]="menuOpen()"
        [attr.aria-expanded]="menuOpen()"
        [title]="menuOpen() ? 'Close' : 'Menu'"
        aria-label="Dashboard menu"
        (click)="toggleMenu()"
      >
        <app-ui-icon [name]="menuOpen() ? 'close' : 'sparkle'" />
      </button>
    </div>

    @if (section(); as active) {
      <section class="panel" role="dialog" aria-modal="false" [attr.aria-label]="label(active)">
        <header><span class="eyebrow">{{ label(active) }}</span></header>

        @switch (active) {
          @case ('widgets') {
            <div class="tiles">
              @for (w of widgets; track w.type) {
                <button
                  class="tile"
                  type="button"
                  [class.on]="dash.isActive(w.type)"
                  [style.border-color]="dash.isActive(w.type) ? w.accent : 'var(--theme-border)'"
                  [style.background]="dash.isActive(w.type) ? tint(w.accent) : 'transparent'"
                  (click)="dash.toggle(w.type)"
                  [title]="(dash.isActive(w.type) ? 'Remove ' : 'Add ') + w.label"
                >
                  <app-ui-icon [style.color]="w.accent" [name]="w.icon" />
                  <span>{{ w.label }}</span>
                </button>
              }
            </div>
            @if (dash.widgets().length) {
              <button class="wide" type="button" (click)="dash.clearAll()">
                <app-ui-icon name="reset" /> Clear board
              </button>
            }
          }

          @case ('companion') {
            <div class="companions">
              @for (p of pets; track p.id) {
                <button
                  class="companion"
                  type="button"
                  [class.on]="pet.petId() === p.id"
                  (click)="pet.select(p.id)"
                  [title]="(pet.petId() === p.id ? 'Dismiss ' : '') + p.label + ' — ' + p.description"
                >
                  <span [class]="'pet-preview ' + p.sprite.cssClass" [style.background-size]="spriteSize(p.sprite)"></span>
                </button>
              }
            </div>
            @if (pet.petId()) {
              <input
                class="field"
                [value]="mood.name()"
                (input)="mood.setName($any($event.target).value)"
                placeholder="name your companion…"
                aria-label="Companion name"
                maxlength="24"
              />
              <div class="energy" role="meter" aria-label="Companion energy"
                aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="round(mood.energy())">
                <div class="energy-fill" [style.width.%]="mood.energy()"></div>
              </div>
              <button class="wide" type="button" (click)="arrangeCozy()">
                <app-ui-icon name="food" /> Arrange cozy corner
              </button>
            }
          }

          @case ('theme') {
            <div class="themes">
              @for (t of themes; track t.id) {
                <button
                  class="theme-card"
                  type="button"
                  [class.on]="settings.theme() === t.id"
                  [attr.aria-pressed]="settings.theme() === t.id"
                  (click)="settings.setTheme(t.id)"
                  [title]="t.description"
                >
                  <span class="swatch" aria-hidden="true">
                    @for (s of t.swatches; track $index) { <span [style.background]="s"></span> }
                    <b><app-ui-icon [name]="t.icon" /></b>
                  </span>
                  <span class="theme-name">{{ t.label }}</span>
                </button>
              }
            </div>
          }

          @case ('effects') {
            <button class="row" type="button" [class.on]="settings.matrixRain()"
              [attr.aria-pressed]="settings.matrixRain()" (click)="settings.matrixRain.set(!settings.matrixRain())">
              <app-ui-icon name="matrix" />
              <span>Code rain</span>
              <small>{{ settings.matrixRain() ? 'ON' : 'OFF' }}</small>
            </button>
            <button class="row" type="button" [class.on]="settings.cursorFx()"
              [attr.aria-pressed]="settings.cursorFx()" (click)="settings.toggleCursorFx()">
              <app-ui-icon name="sparkle" />
              <span>Cursor FX</span>
              <small>{{ settings.cursorFx() ? 'ON' : 'OFF' }}</small>
            </button>
            <button class="row" type="button" (click)="settings.cycleCursorFxMode()" title="Cycle cursor effect style">
              <app-ui-icon [name]="cursorMode().icon" />
              <span>FX style</span>
              <small>{{ cursorMode().label }}</small>
            </button>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      :host { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 40; }
      .scrim { position: fixed; inset: 0; z-index: -1; border: 0; background: rgba(0, 0, 0, 0.28); cursor: default; }
      .hub-ring { position: relative; width: 56px; height: 56px; }

      .hub {
        position: absolute; inset: 0; display: grid; place-items: center; outline: none;
        border: 1px solid var(--theme-border-strong); border-radius: 50%;
        background: var(--theme-panel-opaque); color: var(--theme-primary);
        box-shadow: var(--theme-shadow-strong); font-size: 24px; cursor: pointer;
        transition: color 0.2s ease, border-color 0.2s ease, transform 0.25s ease;
      }
      .hub:hover { color: var(--theme-primary-bright); border-color: var(--theme-primary); }
      .hub-ring.open .hub { transform: rotate(90deg); }
      /* Round focus ring — the global square outline looks wrong on a circle. */
      .hub:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--theme-focus), var(--theme-shadow-strong); }
      .petal:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--theme-focus), var(--theme-shadow-soft); }

      .petal {
        position: absolute; left: 4px; top: 4px; display: grid; place-items: center; outline: none;
        width: 48px; height: 48px; border: 1px solid var(--theme-border-strong); border-radius: 50%;
        background: var(--theme-panel-opaque); color: var(--theme-text-muted);
        box-shadow: var(--theme-shadow-soft); font-size: 19px; cursor: pointer; opacity: 0;
        transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.3), opacity 0.25s ease,
          color 0.2s ease, border-color 0.2s ease;
      }
      .hub-ring.open .petal { opacity: 1; }
      .petal:hover { color: var(--theme-primary-bright); border-color: var(--theme-primary); }
      .petal.active { color: var(--theme-primary-bright); border-color: var(--theme-primary); background: var(--theme-primary-soft); }
      .petal-label {
        position: absolute; bottom: -15px; font: 600 8px/1 var(--theme-font-body);
        letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; color: var(--theme-text-muted);
      }

      .panel {
        position: absolute; left: 50%; bottom: 150px; transform: translateX(-50%);
        width: min(340px, calc(100vw - 32px)); max-height: min(60vh, 480px); overflow: auto;
        display: flex; flex-direction: column; gap: 8px; padding: 14px;
        border: 1px solid var(--theme-border-strong); border-radius: var(--panel-radius);
        background: var(--theme-panel-opaque); color: var(--theme-text);
        box-shadow: var(--theme-shadow-strong);
      }
      .panel header { display: flex; }
      .eyebrow { color: var(--theme-text-muted); font: 600 9px/1 var(--theme-font-body); letter-spacing: 0.22em; text-transform: uppercase; }

      .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .tile {
        display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px;
        border: 1px solid var(--theme-border); border-radius: var(--control-radius);
        color: var(--theme-text-muted); font: 600 9px/1.1 var(--theme-font-body);
        letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: 150ms ease;
      }
      .tile app-ui-icon { font-size: 20px; }
      .tile:hover { background: var(--theme-surface-hover); }
      .tile.on { color: var(--theme-text); }

      .wide {
        display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px;
        border: 1px solid var(--theme-border-strong); border-radius: var(--control-radius);
        background: var(--theme-surface-soft); color: var(--theme-text-muted);
        font: 600 10px/1 var(--theme-font-body); letter-spacing: 0.16em; text-transform: uppercase;
        cursor: pointer; transition: 150ms ease;
      }
      .wide:hover { color: var(--theme-text); background: var(--theme-surface-hover); }

      .companions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .companion {
        display: grid; place-items: center; height: 48px; overflow: hidden;
        border: 1px solid var(--theme-border); border-radius: var(--control-radius);
        cursor: pointer; transition: 150ms ease;
      }
      .companion:hover { background: var(--theme-surface-hover); }
      .companion.on { border-color: var(--theme-primary); background: var(--theme-primary-soft); }
      .pet-preview {
        display: block; width: 38px; height: 41px; background-position: left top; background-repeat: no-repeat;
        image-rendering: pixelated; filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.45));
      }
      .field {
        width: 100%; padding: 6px 8px; border: 1px solid var(--theme-border); border-radius: var(--control-radius);
        background: var(--theme-control-bg); color: var(--theme-text); font-size: 12px; letter-spacing: 0.04em;
      }
      .energy { height: 5px; border-radius: 999px; overflow: hidden; background: var(--theme-surface-soft); }
      .energy-fill { height: 100%; border-radius: 999px; background: linear-gradient(to right, var(--theme-primary), var(--theme-primary-bright)); transition: width 0.4s ease; }

      .themes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
      .theme-card {
        display: flex; align-items: center; gap: 8px; padding: 6px; text-align: left;
        border: 1px solid var(--theme-border); border-radius: var(--control-radius);
        background: var(--theme-surface-soft); color: var(--theme-text); cursor: pointer; transition: 150ms ease;
      }
      .theme-card:hover { border-color: var(--theme-primary); background: var(--theme-surface-hover); }
      .theme-card.on { border-color: var(--theme-primary); box-shadow: inset 0 0 0 1px var(--theme-primary-soft); }
      .swatch { position: relative; display: flex; width: 40px; height: 30px; flex: none; overflow: hidden; border-radius: calc(var(--control-radius) - 2px); }
      .swatch > span { flex: 1; }
      .swatch b { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 14px; text-shadow: 0 2px 4px #000; }
      .theme-name { font: 600 11px/1.1 var(--theme-font-display); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .row {
        display: flex; align-items: center; gap: 10px; padding: 9px 11px;
        border: 1px solid var(--theme-border); border-radius: var(--control-radius);
        background: var(--theme-surface-soft); color: var(--theme-text); cursor: pointer; transition: 150ms ease;
      }
      .row:hover { background: var(--theme-surface-hover); }
      .row app-ui-icon { font-size: 19px; color: var(--theme-text-muted); }
      .row span { flex: 1; font: 600 12px/1 var(--theme-font-body); }
      .row small { font: 700 9px/1 var(--theme-font-body); letter-spacing: 0.14em; color: var(--theme-text-muted); }
      .row.on app-ui-icon, .row.on small { color: var(--theme-primary-bright); }

      @media (prefers-reduced-motion: reduce) {
        .petal, .hub { transition: opacity 0.2s ease; }
        .hub-ring.open .hub { transform: none; }
      }
    `,
  ],
})
export class ControlHub {
  readonly dash = inject(DashboardService);
  readonly pet = inject(PetService);
  readonly mood = inject(PetMoodService);
  private readonly cozy = inject(PetCozyService);
  readonly settings = inject(SettingsService);

  readonly widgets = WIDGETS;
  readonly pets = PETS;
  readonly themes = THEMES;

  readonly menuOpen = signal(false);
  readonly section = signal<Section | null>(null);

  readonly petals: Petal[] = [
    { id: 'widgets', label: 'Widgets', icon: 'layout' },
    { id: 'companion', label: 'Companion', icon: 'duck' },
    { id: 'theme', label: 'Theme', icon: 'brush' },
    { id: 'effects', label: 'Effects', icon: 'sparkle' },
  ];

  readonly themeIcon = computed<IconName>(
    () => this.themes.find((t) => t.id === this.settings.theme())?.icon ?? 'brush',
  );
  readonly cursorMode = computed(
    () => CURSOR_FX_MODES.find((m) => m.id === this.settings.cursorFxMode()) ?? CURSOR_FX_MODES[0],
  );

  /** Fan the petals across a 150° arc above the hub. */
  petalTransform(index: number): string {
    const count = this.petals.length;
    const spread = 150;
    const start = (180 - spread) / 2; // leftmost angle above horizontal
    const angle = (start + (spread / (count - 1)) * index) * (Math.PI / 180);
    const radius = 92;
    const x = Math.cos(angle) * radius;
    const y = -Math.sin(angle) * radius;
    return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  toggleMenu(): void {
    if (this.menuOpen()) this.closeAll();
    else this.menuOpen.set(true);
  }

  openSection(id: Section): void {
    this.section.set(this.section() === id ? null : id);
  }

  closeAll(): void {
    this.section.set(null);
    this.menuOpen.set(false);
  }

  arrangeCozy(): void {
    this.cozy.editing.set(true);
    this.closeAll();
  }

  label(section: Section): string {
    return this.petals.find((p) => p.id === section)?.label ?? '';
  }

  tint(hex: string): string {
    return `color-mix(in srgb, ${hex} 16%, transparent)`;
  }

  spriteSize(sprite: PetSpriteSheet): string {
    return `${sprite.columns * 100}% ${sprite.rows * 100}%`;
  }

  round(value: number): number {
    return Math.round(value);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen()) this.closeAll();
  }
}
