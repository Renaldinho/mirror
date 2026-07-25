import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Background } from './background';
import { LightingControl } from './lighting-control';
import { WidgetGrid } from './widget-grid';
import { WidgetFrame } from './widget-frame';
import { PetRenderer } from './pet-renderer';
import { DashboardService } from './dashboard.service';
import { AmbienceService } from './ambience.service';
import { ThemePicker } from './theme-picker';
import { RetroCursor } from './retro-cursor';
import { GamesLauncher } from '../minigames/games-launcher';
import { GameOverlay } from '../minigames/game-overlay';
import { SpotifyService } from '../widgets/spotify/spotify.service';

/** The mirror display itself: the ambient dark-academia board shown on the Pi. */
@Component({
  selector: 'app-mirror-page',
  imports: [
    Background,
    LightingControl,
    WidgetGrid,
    WidgetFrame,
    PetRenderer,
    ThemePicker,
    RetroCursor,
    GamesLauncher,
    GameOverlay,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="board-surface relative h-screen w-screen overflow-hidden bg-black">
      <app-background />

      <!-- controls -->
      <app-widget-grid />
      <app-theme-picker />
      <app-lighting-control />
      <app-games-launcher />

      <!-- desktop pet -->
      <app-pet />

      @for (w of dash.widgets(); track w.type) {
        <app-widget-frame [widget]="w" />
      }

      <app-game-overlay />

      <app-retro-cursor />
    </main>
  `,
  styles: [`:host { display: block; height: 100vh; }`],
})
export class MirrorPage {
  readonly dash = inject(DashboardService);
  // Constructed so the auto-dim scheduler starts with the mirror.
  private readonly ambience = inject(AmbienceService);
  // Constructed so the Spotify OAuth redirect is handled on load.
  private readonly spotify = inject(SpotifyService);
}
