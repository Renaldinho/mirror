import { ChangeDetectionStrategy, Component, HostListener, computed, inject } from '@angular/core';
import { DuckHunt } from './duck-hunt/duck-hunt';
import { GamesService } from './games.service';
import { GameId, GAMES } from './games-registry';
import { Whack } from './whack/whack';

/** Fullscreen modal that hosts the active game. Provides shared chrome
 *  (title, mute, close); each game renders its own play area + stats. */
@Component({
  selector: 'app-game-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DuckHunt, Whack],
  template: `
    @if (games.activeGame(); as id) {
      <button class="backdrop" (click)="games.close()" aria-label="Close game"></button>
      <section class="frame" role="dialog" aria-modal="true" [attr.aria-label]="meta(id).label">
        <header class="chrome">
          <span class="title">{{ meta(id).glyph }} {{ meta(id).label }}</span>
          <span class="spacer"></span>
          <button
            class="chrome-btn"
            (click)="games.toggleMute()"
            [attr.aria-pressed]="!games.muted()"
            [attr.aria-label]="games.muted() ? 'Unmute' : 'Mute'"
          >
            {{ games.muted() ? '🔇' : '🔊' }}
          </button>
          <button class="chrome-btn" (click)="games.close()" aria-label="Close game">×</button>
        </header>
        <div class="stage">
          @switch (id) {
            @case ('duck-hunt') { <app-duck-hunt /> }
            @case ('whack') { <app-whack /> }
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 60;
        pointer-events: none;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(4px);
        pointer-events: auto;
      }
      .frame {
        position: absolute;
        inset: 3vmin;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--panel-radius);
        border: 1px solid var(--theme-border-strong);
        background: var(--theme-panel-opaque);
        box-shadow: var(--theme-shadow-strong);
        color: var(--theme-text);
      }
      .chrome {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--theme-border);
      }
      .title {
        font: 600 14px/1 var(--theme-font-display);
        letter-spacing: 0.08em;
      }
      .spacer { flex: 1; }
      .chrome-btn {
        display: grid;
        width: 30px;
        height: 30px;
        place-items: center;
        border-radius: var(--control-radius);
        border: 1px solid var(--theme-border);
        background: var(--theme-control-bg);
        color: var(--theme-text);
        font-size: 16px;
        cursor: pointer;
      }
      .chrome-btn:hover { background: var(--theme-surface-hover); }
      .stage {
        position: relative;
        flex: 1;
        min-height: 0;
      }
    `,
  ],
})
export class GameOverlay {
  readonly games = inject(GamesService);
  private readonly metaById = computed(() =>
    Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, (typeof GAMES)[number]>,
  );

  meta(id: GameId) {
    return this.metaById()[id];
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.games.playing()) this.games.close();
  }
}
