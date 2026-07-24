import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AudioFx } from '../audio';
import { GamesService } from '../games.service';

type Phase = 'ready' | 'round' | 'gameover';
type DuckPhase = 'fly' | 'hit' | 'fall' | 'flee' | 'gone';

interface Duck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: DuckPhase;
  t: number;
}
interface Dog {
  mode: 'hidden' | 'sniff' | 'jump' | 'laugh';
  t: number;
  x: number;
}

const DUCK_SIZE = 44;
const HIT_RADIUS = 32;
const FLIGHT_TIME = 4.2;
const MISS_CAP = 10;
const WAVES_PER_ROUND = 6;

/** A Duck Hunt–style shooter: click flying ducks before they flee; the dog
 *  retrieves hits and laughs at misses. Canvas + RAF, built-in emoji art. */
@Component({
  selector: 'app-duck-hunt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <canvas #canvas></canvas>

      <div class="hud">
        <span class="chip">Round {{ round() }}</span>
        <span class="chip">Score {{ score() }}</span>
        <span class="chip">Hi {{ games.highScore('duck-hunt') }}</span>
        <span class="chip ammo">
          @for (s of [0, 1, 2]; track s) {
            <b [class.spent]="s >= ammo()">●</b>
          }
        </span>
        <span class="chip miss">{{ missMarks() }}</span>
      </div>

      @if (phase() === 'ready') {
        <div class="banner"><span>Round {{ round() }}</span><small>get ready…</small></div>
      }
      @if (phase() === 'gameover') {
        <div class="over">
          <h2>Game Over</h2>
          <p>Score {{ score() }} @if (record()) { <em>· new record!</em> }</p>
          <button (click)="restart()">Play again</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; cursor: none; }
      .wrap { position: relative; width: 100%; height: 100%; overflow: hidden; }
      canvas { display: block; width: 100%; height: 100%; }
      .hud {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        pointer-events: none;
      }
      .chip {
        padding: 3px 9px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.4);
        color: #f4efe0;
        font: 600 12px/1.4 var(--theme-font-body);
        letter-spacing: 0.06em;
      }
      .ammo b { color: #ffd76a; }
      .ammo b.spent { color: #6b6256; }
      .miss { color: #ff8f8f; letter-spacing: 0.12em; }
      .banner, .over {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        text-align: center;
        color: #f4efe0;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
      }
      .banner span { font: 700 34px/1 var(--theme-font-display); letter-spacing: 0.1em; }
      .banner small { letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.85; }
      .over { background: rgba(0, 0, 0, 0.45); }
      .over h2 { font: 700 40px/1 var(--theme-font-display); margin: 0; }
      .over em { color: #ffd76a; font-style: normal; }
      .over button {
        margin-top: 10px;
        padding: 9px 18px;
        border-radius: var(--control-radius);
        border: 1px solid var(--theme-border-strong);
        background: var(--theme-primary-soft);
        color: var(--theme-primary-bright);
        font: 600 14px/1 var(--theme-font-body);
        cursor: pointer;
      }
    `,
  ],
})
export class DuckHunt implements AfterViewInit {
  readonly games = inject(GamesService);
  private readonly sfx = inject(AudioFx);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly phase = signal<Phase>('ready');
  readonly round = signal(1);
  readonly score = signal(0);
  readonly ammo = signal(3);
  readonly misses = signal(0);
  readonly record = signal(false);
  readonly missMarks = computed(() => '✕'.repeat(this.misses()) || '—');

  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private raf = 0;
  private prev = 0;
  private elapsed = 0;

  private ducks: Duck[] = [];
  private dog: Dog = { mode: 'hidden', t: 0, x: 0 };
  private readonly pointer = { x: 0, y: 0 };
  private flash = 0;
  private spawnDelay = 0;
  private waveInRound = 0;
  private readyTimer = 0;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext('2d')!;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = rect.width;
      this.h = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      this.shoot();
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    this.enterReady();
    const loop = (t: number) => {
      const dt = this.prev ? Math.min((t - this.prev) / 1000, 0.05) : 0;
      this.prev = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    });
  }

  restart(): void {
    this.ducks = [];
    this.score.set(0);
    this.misses.set(0);
    this.round.set(1);
    this.record.set(false);
    this.waveInRound = 0;
    this.elapsed = 0;
    this.enterReady();
  }

  private get groundY(): number {
    return this.h * 0.8;
  }

  private enterReady(): void {
    this.phase.set('ready');
    this.readyTimer = 1.4;
    this.dog = { mode: 'sniff', t: 0, x: 40 };
  }

  private speed(): number {
    // Ramps with rounds and with time survived, so it keeps getting harder.
    return 90 + this.round() * 16 + Math.min(150, this.elapsed * 2);
  }

  private concurrent(): number {
    return Math.min(1 + Math.floor((this.round() - 1) / 3), 3);
  }

  private spawnWave(): void {
    this.ammo.set(3);
    const n = this.concurrent();
    for (let i = 0; i < n; i++) this.ducks.push(this.spawnDuck());
    this.waveInRound++;
  }

  private spawnDuck(): Duck {
    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;
    const s = this.speed() * (0.7 + Math.random() * 0.6);
    return {
      x: fromLeft ? -30 : this.w + 30,
      y: 70 + Math.random() * Math.max(40, this.groundY - 150),
      vx: dir * s,
      vy: -(18 + Math.random() * 28),
      phase: 'fly',
      t: 0,
    };
  }

  private shoot(): void {
    if (this.phase() !== 'round' || this.ammo() <= 0) return;
    this.ammo.update((a) => a - 1);
    this.flash = 0.06;
    this.sfx.play('shot');

    let best: Duck | null = null;
    let bestD = HIT_RADIUS;
    for (const d of this.ducks) {
      if (d.phase !== 'fly') continue;
      const dist = Math.hypot(d.x - this.pointer.x, d.y - this.pointer.y);
      if (dist < bestD) {
        best = d;
        bestD = dist;
      }
    }
    if (best) {
      best.phase = 'hit';
      best.t = 0;
      this.score.update((v) => v + Math.round(100 + this.speed() * 0.3));
      this.sfx.play('hit');
      this.dog = { mode: 'jump', t: 0, x: best.x };
    }
  }

  private update(dt: number): void {
    if (dt === 0) return;
    if (this.phase() !== 'gameover') this.elapsed += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.updateDog(dt);

    if (this.phase() === 'ready') {
      this.readyTimer -= dt;
      if (this.readyTimer <= 0) {
        this.phase.set('round');
        this.spawnWave();
      }
      return;
    }
    if (this.phase() !== 'round') return;

    // Out of ammo with ducks still flying → they escape.
    if (this.ammo() <= 0 && this.ducks.some((d) => d.phase === 'fly')) {
      for (const d of this.ducks) if (d.phase === 'fly') this.flee(d);
    }

    for (const d of this.ducks) this.updateDuck(d, dt);
    this.ducks = this.ducks.filter((d) => d.phase !== 'gone');

    // Air cleared → next wave / round after a beat.
    if (this.ducks.length === 0) {
      this.spawnDelay -= dt;
      if (this.spawnDelay <= 0) {
        if (this.waveInRound >= WAVES_PER_ROUND) {
          this.round.update((r) => r + 1);
          this.waveInRound = 0;
          this.enterReady();
        } else {
          this.spawnWave();
        }
        this.spawnDelay = 0.6;
      }
    } else {
      this.spawnDelay = 0.6;
    }
  }

  private updateDuck(d: Duck, dt: number): void {
    d.t += dt;
    if (d.phase === 'fly') {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y < 40) d.vy = Math.abs(d.vy);
      if (d.y > this.groundY - 40) d.vy = -Math.abs(d.vy);
      if (d.x < 20) { d.x = 20; d.vx = Math.abs(d.vx); }
      if (d.x > this.w - 20) { d.x = this.w - 20; d.vx = -Math.abs(d.vx); }
      if (d.t > FLIGHT_TIME) this.flee(d);
    } else if (d.phase === 'hit') {
      if (d.t > 0.16) { d.phase = 'fall'; d.vy = 0; }
    } else if (d.phase === 'fall') {
      d.vy += 900 * dt;
      d.y += d.vy * dt;
      if (d.y > this.groundY + 30) d.phase = 'gone';
    } else if (d.phase === 'flee') {
      d.y -= 320 * dt;
      d.x += d.vx * 0.3 * dt;
      if (d.y < -40) d.phase = 'gone';
    }
  }

  private flee(d: Duck): void {
    if (d.phase === 'flee') return;
    d.phase = 'flee';
    this.misses.update((m) => m + 1);
    this.sfx.play('quack');
    this.dog = { mode: 'laugh', t: 0, x: d.x };
    if (this.misses() >= MISS_CAP) this.gameOver();
  }

  private gameOver(): void {
    this.phase.set('gameover');
    this.sfx.play('gameover');
    this.record.set(this.games.submitScore('duck-hunt', this.score()));
  }

  private updateDog(dt: number): void {
    const dog = this.dog;
    dog.t += dt;
    if (dog.mode === 'sniff') {
      dog.x = 40 + (this.w * 0.5 - 40) * Math.min(1, dog.t / 1.4);
    } else if (dog.mode === 'jump' && dog.t > 0.7) {
      dog.mode = 'hidden';
    } else if (dog.mode === 'laugh' && dog.t > 0.9) {
      dog.mode = 'hidden';
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    const { w, h } = this;
    const gy = this.groundY;

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#243b6b');
    sky.addColorStop(1, '#6d84b4');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, gy);
    // grass
    const grass = ctx.createLinearGradient(0, gy, 0, h);
    grass.addColorStop(0, '#4f7a34');
    grass.addColorStop(1, '#2f5220');
    ctx.fillStyle = grass;
    ctx.fillRect(0, gy, w, h - gy);

    for (const d of this.ducks) this.drawDuck(ctx, d);
    this.drawDog(ctx);

    // muzzle flash
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,200,${this.flash * 6})`;
      ctx.fillRect(0, 0, w, h);
    }

    // crosshair
    this.drawCrosshair(ctx);
  }

  private drawDuck(ctx: CanvasRenderingContext2D, d: Duck): void {
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.phase === 'fall') ctx.rotate(Math.PI);
    else if (d.phase === 'fly' && d.vx > 0) ctx.scale(-1, 1);
    ctx.font = `${DUCK_SIZE}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bob = d.phase === 'fly' ? Math.sin(d.t * 12) * 3 : 0;
    ctx.fillText('🦆', 0, bob);
    ctx.restore();
  }

  private drawDog(ctx: CanvasRenderingContext2D): void {
    const dog = this.dog;
    if (dog.mode === 'hidden') return;
    const gy = this.groundY;
    ctx.font = '46px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if (dog.mode === 'sniff') {
      const bob = Math.sin(dog.t * 8) * 3;
      ctx.fillText('🐕', dog.x, gy + 34 + bob);
    } else if (dog.mode === 'jump') {
      const up = Math.sin(Math.min(1, dog.t / 0.7) * Math.PI) * 70;
      ctx.fillText('🐕', dog.x, gy + 20 - up);
      ctx.font = '30px serif';
      ctx.fillText('🦆', dog.x + 20, gy - 4 - up);
    } else if (dog.mode === 'laugh') {
      const up = Math.sin(Math.min(1, dog.t / 0.9) * Math.PI) * 44;
      ctx.fillText('😆', dog.x, gy + 24 - up);
    }
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.pointer;
    ctx.save();
    ctx.strokeStyle = '#ff3b57';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x - 6, y);
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + 18, y);
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y - 6);
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y + 18);
    ctx.stroke();
    ctx.restore();
  }
}
