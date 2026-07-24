import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { AudioFx } from '../audio';
import { GamesService } from '../games.service';

interface Hole {
  up: boolean;
  ttl: number;
}

const ROUND_TIME = 30;
const TICK = 0.1;

/** Whack-a-Mole: bonk moles as they pop, before a 30s timer runs out. */
@Component({
  selector: 'app-whack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="hud">
        <span class="chip">Score {{ score() }}</span>
        <span class="chip">Hi {{ games.highScore('whack') }}</span>
        <span class="chip time" [class.low]="timeLeft() <= 5">⏱ {{ timeLeft() }}</span>
      </div>

      <div class="grid" [class.dim]="phase() === 'over'">
        @for (hole of holes(); track $index) {
          <button class="hole" [class.up]="hole.up" (pointerdown)="whack($index)" aria-label="Mole">
            <span class="mole">🐹</span>
          </button>
        }
      </div>

      @if (phase() === 'over') {
        <div class="over">
          <h2>Time!</h2>
          <p>Score {{ score() }} @if (record()) { <em>· new record!</em> }</p>
          <button (click)="restart()">Play again</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; }
      .wrap { position: relative; display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 18px; width: 100%; height: 100%; }
      .hud { display: flex; gap: 8px; }
      .chip {
        padding: 3px 9px; border-radius: 999px; background: var(--theme-surface-soft);
        color: var(--theme-text); font: 600 12px/1.4 var(--theme-font-body); letter-spacing: 0.06em;
      }
      .time.low { color: #ff8f8f; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .grid.dim { filter: blur(2px) brightness(0.6); }
      .hole {
        display: grid; place-items: center; overflow: hidden;
        width: min(20vmin, 116px); height: min(20vmin, 116px);
        border-radius: 50%; cursor: pointer;
        border: 3px solid var(--theme-border-strong);
        background: radial-gradient(circle at 50% 120%, var(--theme-surface-hover), #0000 70%),
          var(--theme-control-bg);
      }
      .mole {
        font-size: min(12vmin, 68px);
        transform: translateY(120%);
        transition: transform 0.11s ease;
      }
      .hole.up .mole { transform: translateY(8%); }
      .over {
        position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 6px; color: var(--theme-text); text-align: center;
      }
      .over h2 { font: 700 40px/1 var(--theme-font-display); margin: 0; }
      .over em { color: var(--theme-primary-bright); font-style: normal; }
      .over button {
        margin-top: 10px; padding: 9px 18px; border-radius: var(--control-radius);
        border: 1px solid var(--theme-border-strong); background: var(--theme-primary-soft);
        color: var(--theme-primary-bright); font: 600 14px/1 var(--theme-font-body); cursor: pointer;
      }
    `,
  ],
})
export class Whack implements OnInit {
  readonly games = inject(GamesService);
  private readonly sfx = inject(AudioFx);
  private readonly destroyRef = inject(DestroyRef);

  readonly holes = signal<Hole[]>(Array.from({ length: 9 }, () => ({ up: false, ttl: 0 })));
  readonly score = signal(0);
  readonly timeLeft = signal(ROUND_TIME);
  readonly phase = signal<'play' | 'over'>('play');
  readonly record = signal(false);

  private spawnAcc = 0;
  private spawnEvery = 0.9;
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.start();
    this.destroyRef.onDestroy(() => this.stop());
  }

  restart(): void {
    this.start();
  }

  whack(i: number): void {
    if (this.phase() !== 'play') return;
    const holes = this.holes();
    if (!holes[i].up) return;
    this.set(i, false);
    this.score.update((s) => s + 1);
    this.sfx.play('hit');
  }

  private start(): void {
    this.stop();
    this.holes.set(Array.from({ length: 9 }, () => ({ up: false, ttl: 0 })));
    this.score.set(0);
    this.timeLeft.set(ROUND_TIME);
    this.spawnAcc = 0;
    this.spawnEvery = 0.9;
    this.record.set(false);
    this.phase.set('play');
    this.timer = setInterval(() => this.tick(), TICK * 1000);
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private tick(): void {
    this.timeLeft.update((t) => Math.max(0, +(t - TICK).toFixed(1)));
    if (this.timeLeft() <= 0) {
      this.gameOver();
      return;
    }

    // retract expired moles
    const holes = this.holes().map((h) => (h.up ? { ...h, ttl: h.ttl - TICK } : h));
    let changed = false;
    holes.forEach((h, i) => {
      if (h.up && h.ttl <= 0) { holes[i] = { up: false, ttl: 0 }; changed = true; }
    });

    // spawn
    this.spawnAcc += TICK;
    if (this.spawnAcc >= this.spawnEvery) {
      this.spawnAcc = 0;
      this.spawnEvery = Math.max(0.45, this.spawnEvery - 0.02);
      const down = holes.map((h, i) => (h.up ? -1 : i)).filter((i) => i >= 0);
      if (down.length) {
        const i = down[Math.floor(Math.random() * down.length)];
        holes[i] = { up: true, ttl: 0.6 + Math.random() * 0.6 };
        this.sfx.play('quack');
        changed = true;
      }
    }

    if (changed) this.holes.set(holes);
  }

  private set(i: number, up: boolean): void {
    const holes = [...this.holes()];
    holes[i] = { up, ttl: up ? 0.8 : 0 };
    this.holes.set(holes);
  }

  private gameOver(): void {
    this.stop();
    this.phase.set('over');
    this.sfx.play('gameover');
    this.record.set(this.games.submitScore('whack', this.score()));
  }
}
