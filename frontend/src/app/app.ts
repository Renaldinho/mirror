import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Background } from './dashboard/background';
import { LightingControl } from './dashboard/lighting-control';
import { WidgetGrid } from './dashboard/widget-grid';
import { WidgetFrame } from './dashboard/widget-frame';
import { PetRenderer } from './dashboard/pet-renderer';
import { DashboardService } from './dashboard/dashboard.service';
import { AmbienceService } from './dashboard/ambience.service';
import { ThemePicker } from './dashboard/theme-picker';
import { RetroCursor } from './dashboard/retro-cursor';
import { GamesLauncher } from './minigames/games-launcher';
import { GameOverlay } from './minigames/game-overlay';

@Component({
  selector: 'app-root',
  imports: [Background, LightingControl, WidgetGrid, WidgetFrame, PetRenderer, ThemePicker, RetroCursor, GamesLauncher, GameOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly dash = inject(DashboardService);
  // Constructed so the auto-dim scheduler starts with the app.
  private readonly ambience = inject(AmbienceService);
}
