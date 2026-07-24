import { Injectable, computed, effect, signal } from '@angular/core';
import { GameId } from './games-registry';

const SCORES_KEY = 'dash.games.v1';
const MUTED_KEY = 'dash.games.muted';

/**
 * Arcade state: which game is open, per-game high scores, and a shared SFX mute.
 * High scores persist to localStorage (same pattern as DashboardService).
 */
@Injectable({ providedIn: 'root' })
export class GamesService {
  readonly activeGame = signal<GameId | null>(null);
  readonly gameCursorSuppressed = signal(false);
  readonly muted = signal(this.loadMuted());
  readonly playing = computed(() => this.activeGame() !== null);

  private readonly scores = signal<Partial<Record<GameId, number>>>(this.loadScores());

  constructor() {
    effect(() => localStorage.setItem(SCORES_KEY, JSON.stringify(this.scores())));
    effect(() => localStorage.setItem(MUTED_KEY, JSON.stringify(this.muted())));
  }

  open(id: GameId): void {
    this.gameCursorSuppressed.set(false);
    this.activeGame.set(id);
  }

  close(): void {
    this.gameCursorSuppressed.set(false);
    this.activeGame.set(null);
  }

  toggleMute(): void {
    this.muted.update((m) => !m);
  }

  highScore(id: GameId): number {
    return this.scores()[id] ?? 0;
  }

  /** Records a run; returns true if it set a new record. */
  submitScore(id: GameId, value: number): boolean {
    if (value <= this.highScore(id)) return false;
    this.scores.update((all) => ({ ...all, [id]: value }));
    return true;
  }

  private loadScores(): Partial<Record<GameId, number>> {
    try {
      const raw = localStorage.getItem(SCORES_KEY);
      return raw ? (JSON.parse(raw) as Partial<Record<GameId, number>>) : {};
    } catch {
      return {};
    }
  }

  private loadMuted(): boolean {
    return localStorage.getItem(MUTED_KEY) === 'true';
  }
}
