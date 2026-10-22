import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Background } from './background';
import { ControlHub } from './control-hub';
import { WidgetFrame } from './widget-frame';
import { PetRenderer } from './pet-renderer';
import { PetHabitat } from './pet-habitat';
import { DashboardService } from './dashboard.service';
import { RetroCursor } from './retro-cursor';
import { GameOverlay } from '../minigames/game-overlay';
import { SpotifyService } from '../widgets/spotify/spotify.service';
import { DisplayService } from './display.service';
import { AlarmPopup } from '../widgets/alarm-popup';
import { SettingsService } from './settings.service';

/** The mirror display itself: the ambient dark-academia board shown on the Pi. */
@Component({
  selector: 'app-mirror-page',
  imports: [
    Background,
    ControlHub,
    WidgetFrame,
    PetRenderer,
    PetHabitat,
    RetroCursor,
    GameOverlay,
    AlarmPopup,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="board-surface relative h-screen w-screen overflow-hidden bg-black">
      <app-background />

      <!-- controls -->
      <app-control-hub />

      <!-- desktop pet -->
      <app-pet-habitat />
      <app-pet />

      <section class="widget-board" aria-label="Mirror widgets"
        [class.portrait]="display.portrait()"
        [style.--rows]="rows()">
        @for (w of dash.widgets(); track w.type) {
          <app-widget-frame [widget]="w" [attr.data-widget]="w.type" />
        }
      </section>

      <app-game-overlay />
      <app-alarm-popup />

      <app-retro-cursor />
      <div class="display-dimmer" aria-hidden="true" [style.opacity]="1 - settings.brightness()"></div>
    </main>
  `,
  styles: [`
    :host { display: block; height: 100dvh; }
    .board-surface { height: 100dvh; }
    .display-dimmer { position: fixed; inset: 0; z-index: 2147483647; background: #000; pointer-events: none; }
    .widget-board { position: absolute; inset: 0; pointer-events: none; }
    .widget-board app-widget-frame { pointer-events: auto; }
    .widget-board.portrait {
      inset: 120px 5vw clamp(120px, 10dvh, 220px);
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(var(--rows), minmax(min(360px, 45vw), 1fr));
      gap: clamp(16px, 3vw, 32px);
      overflow: auto;
      scrollbar-gutter: stable;
      pointer-events: auto;
    }
    .portrait app-widget-frame { display: grid; place-items: center; min-width: 0; }
    @media (max-width: 599px) {
      .widget-board.portrait {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: repeat(var(--rows), minmax(360px, 1fr));
      }
    }
  `],
})
export class MirrorPage {
  readonly dash = inject(DashboardService);
  readonly display = inject(DisplayService);
  readonly settings = inject(SettingsService);
  rows(): number { return Math.max(1, Math.ceil(this.dash.widgets().length / this.display.columns())); }
  // Constructed so the Spotify OAuth redirect is handled on load.
  private readonly spotify = inject(SpotifyService);
}
