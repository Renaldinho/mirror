import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GamesService } from './games.service';
import { GameId, GAMES } from './games-registry';
import { UiIcon } from '../shared/ui-icon';

/** Bottom-left arcade cabinet: opens a small menu of minigames. */
@Component({
  selector: 'app-games-launcher',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-4 left-4 z-20 flex flex-col items-start gap-2">
      @if (open()) {
        <div class="menu">
          <div class="menu-head">Arcade</div>
          @for (g of gamesList; track g.id) {
            <button class="game-row" (click)="play(g.id)" [title]="g.description">
              @if (g.thumbnail) {
                <img class="game-thumb" [src]="g.thumbnail" alt="" aria-hidden="true" />
              } @else {
                <app-ui-icon class="glyph" [name]="g.icon" />
              }
              <span class="labels">
                <span class="name">{{ g.label }}</span>
                <span class="hi">HI {{ games.highScore(g.id) }}</span>
              </span>
            </button>
          }
        </div>
      }

      <button
        class="trigger"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="open() ? 'Close arcade' : 'Open arcade'"
        title="Arcade"
      >
        <app-ui-icon [name]="open() ? 'close' : 'gamepad'" />
      </button>
    </div>
  `,
  styles: [
    `
      .trigger {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: var(--control-radius);
        border: 1px solid var(--theme-border-strong);
        background: var(--theme-panel);
        box-shadow: var(--theme-shadow-soft);
        backdrop-filter: none;
        color: var(--theme-text);
        font-size: 18px;
        cursor: pointer;
      }
      .menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 208px;
        padding: 8px;
        border-radius: var(--panel-radius);
        border: 1px solid var(--theme-border-strong);
        background: var(--theme-panel);
        box-shadow: var(--theme-shadow-strong);
        backdrop-filter: none;
      }
      .menu-head {
        padding: 0 4px 4px;
        color: var(--theme-text-muted);
        font: 600 10px/1 var(--theme-font-body);
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }
      .game-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 8px;
        border-radius: var(--control-radius);
        border: 1px solid transparent;
        background: transparent;
        color: var(--theme-text);
        cursor: pointer;
        text-align: left;
      }
      .game-row:hover {
        background: var(--theme-surface-hover);
        border-color: var(--theme-border);
      }
      .glyph { font-size: 20px; }
      .game-thumb {
        width: 44px;
        height: 30px;
        flex: 0 0 auto;
        border: 1px solid var(--theme-border);
        border-radius: calc(var(--control-radius) * .65);
        object-fit: cover;
        image-rendering: pixelated;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .28);
      }
      .labels { display: flex; flex-direction: column; line-height: 1.25; }
      .name { font-size: 13px; }
      .hi {
        color: var(--theme-text-muted);
        font: 600 9px/1 var(--theme-font-body);
        letter-spacing: 0.12em;
      }
    `,
  ],
})
export class GamesLauncher {
  readonly games = inject(GamesService);
  readonly gamesList = GAMES;
  readonly open = signal(false);

  play(id: GameId): void {
    this.games.open(id);
    this.open.set(false);
  }
}
