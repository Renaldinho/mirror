import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';
import { ThemeDefinition, THEMES } from './theme-registry';
import { UiIcon } from '../shared/ui-icon';

@Component({
  selector: 'app-theme-picker',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="theme-trigger"
      type="button"
      [attr.aria-expanded]="open()"
      aria-controls="theme-gallery"
      title="Change theme"
      (click)="open.update((value) => !value)"
    >
      <app-ui-icon [name]="active().icon" />
    </button>

    @if (open()) {
      <button class="dismiss-layer" type="button" aria-label="Close theme gallery" (click)="open.set(false)"></button>
      <section id="theme-gallery" class="theme-gallery" role="dialog" aria-modal="true" aria-label="Choose a theme">
        <header>
          <div>
            <span class="eyebrow">Mirror appearance</span>
            <h2>Choose a theme</h2>
          </div>
          <button class="close" type="button" aria-label="Close theme gallery" (click)="open.set(false)"><app-ui-icon name="close" /></button>
        </header>

        <div class="theme-grid">
          @for (theme of themes; track theme.id) {
            <button
              type="button"
              class="theme-card"
              [class.active]="settings.theme() === theme.id"
              [attr.aria-pressed]="settings.theme() === theme.id"
              (click)="select(theme)"
            >
              <span class="preview" aria-hidden="true">
                @for (swatch of theme.swatches; track $index) {
                  <span [style.background]="swatch"></span>
                }
                <b><app-ui-icon [name]="theme.icon" /></b>
              </span>
              <span class="copy">
                <strong>{{ theme.label }}</strong>
                <small>{{ theme.description }}</small>
              </span>
              <span class="check" aria-hidden="true">@if (settings.theme() === theme.id) { <app-ui-icon name="check" /> }</span>
            </button>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host { position: fixed; left: 64px; top: 16px; z-index: 32; }
      .theme-trigger {
        display: grid; width: 40px; height: 40px; place-items: center;
        border: 1px solid var(--theme-border-strong); border-radius: var(--control-radius);
        background: var(--theme-panel); color: var(--theme-primary);
        box-shadow: var(--theme-shadow-soft); backdrop-filter: none;
        font-size: 19px; cursor: pointer; transition: 180ms ease;
      }
      .theme-trigger:hover { color: var(--theme-primary-bright); border-color: var(--theme-primary); transform: translateY(-1px); }
      .dismiss-layer { position: fixed; inset: 0; z-index: -1; border: 0; background: rgba(0, 0, 0, 0.22); cursor: default; }
      .theme-gallery {
        position: absolute; left: 184px; top: 0; width: min(440px, calc(100vw - 264px));
        max-height: calc(100vh - 32px); overflow: auto;
        padding: 14px; border: 1px solid var(--theme-border-strong);
        border-radius: var(--panel-radius); background: var(--theme-panel-opaque);
        color: var(--theme-text); box-shadow: var(--theme-shadow-strong);
        backdrop-filter: none;
      }
      header { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding: 2px 2px 12px; }
      .eyebrow { color: var(--theme-text-muted); font: 600 9px/1 var(--theme-font-body); letter-spacing: 0.2em; text-transform: uppercase; }
      h2 { margin: 4px 0 0; color: var(--theme-text); font: 500 20px/1.1 var(--theme-font-display); }
      .close { color: var(--theme-text-muted); font-size: 22px; line-height: 1; cursor: pointer; }
      .theme-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .theme-card {
        position: relative; display: grid; grid-template-columns: 64px 1fr 14px; gap: 9px; align-items: center;
        min-height: 74px; padding: 8px; text-align: left; border: 1px solid var(--theme-border);
        border-radius: calc(var(--control-radius) + 2px); background: var(--theme-surface-soft);
        color: var(--theme-text); cursor: pointer; transition: 160ms ease;
      }
      .theme-card:hover { border-color: var(--theme-primary); background: var(--theme-surface-hover); transform: translateY(-1px); }
      .theme-card.active { border-color: var(--theme-primary); box-shadow: inset 0 0 0 1px var(--theme-primary-soft); }
      .preview {
        position: relative; display: flex; width: 64px; height: 50px; overflow: hidden;
        border: 1px solid var(--theme-border); border-radius: calc(var(--control-radius) - 2px);
      }
      .preview > span { flex: 1; }
      .preview b {
        position: absolute; inset: 0; display: grid; place-items: center;
        color: #fff; font-size: 19px; text-shadow: 0 2px 5px #000;
      }
      .copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
      .copy strong { font: 600 12px/1.1 var(--theme-font-display); }
      .copy small { color: var(--theme-text-muted); font: 400 10px/1.25 var(--theme-font-body); }
      .check { color: var(--theme-primary-bright); font-size: 13px; }
      @media (max-width: 620px) {
        :host { left: 60px; top: 12px; }
        .theme-gallery { position: fixed; left: 12px; right: 12px; top: 60px; width: auto; max-height: calc(100vh - 72px); }
        .theme-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class ThemePicker {
  readonly settings = inject(SettingsService);
  readonly themes = THEMES;
  readonly open = signal(false);

  active(): ThemeDefinition {
    return this.themes.find((theme) => theme.id === this.settings.theme()) ?? this.themes[0];
  }

  select(theme: ThemeDefinition): void {
    this.settings.setTheme(theme.id);
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.open.set(false);
  }
}
