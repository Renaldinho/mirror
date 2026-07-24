import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { SettingsService } from '../../dashboard/settings.service';
import { AudioFx } from '../audio';
import { GamesService } from '../games.service';
import { DuckHuntAim } from './duck-hunt-aim';
import {
  ATLAS_COLUMNS,
  ATLAS_ROWS,
  DOG_FRAMES,
  DUCK_FRAMES,
  DUCK_HUNT_SPRITES,
  DUCK_HUNT_THEME_STYLES,
  DuckHuntThemeStyle,
  EFFECT_FRAMES,
} from './duck-hunt-assets';

type Phase = 'ready' | 'round' | 'gameover';
type DuckPhase = 'fly' | 'hit' | 'fall' | 'flee' | 'gone';
type AtlasSource = HTMLImageElement | HTMLCanvasElement;

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

interface ImpactFx {
  x: number;
  y: number;
  t: number;
}

interface ShotFx {
  x: number;
  y: number;
  t: number;
}

interface LoadedArt {
  background: HTMLImageElement | null;
  duck: AtlasSource | null;
  dog: AtlasSource | null;
  effects: AtlasSource | null;
}

const DUCK_SIZE = 108;
const DOG_SIZE = 132;
const HIT_RADIUS = 34;
const FLIGHT_TIME = 4.2;
const MISS_CAP = 10;
const WAVES_PER_ROUND = 6;

/** Themed light-gun game with generated pixel art and a deliberately offset aim model. */
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
        <span class="chip ammo" [attr.aria-label]="ammo() + ' shots remaining'">
          @for (slot of ammoSlots; track slot) {
            <b
              class="hud-icon shell"
              [class.spent]="slot >= ammo()"
              aria-hidden="true"
            ></b>
          }
        </span>
        <span class="chip misses" [attr.aria-label]="misses() + ' misses'">
          @for (slot of missSlots; track slot) {
            <b
              class="hud-icon miss-mark"
              [class.visible]="slot < misses()"
              aria-hidden="true"
            ></b>
          }
        </span>
      </div>

      @if (!assetsReady()) {
        <div class="banner loading"><span>Loading gallery</span><small>painting the hunting ground…</small></div>
      } @else if (phase() === 'ready') {
        <div class="banner"><span>Round {{ round() }}</span><small>calibrating scope…</small></div>
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
      .wrap { position: relative; width: 100%; height: 100%; overflow: hidden; background: #020306; }
      canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
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
        display: flex;
        min-height: 25px;
        align-items: center;
        gap: 2px;
        padding: 3px 9px;
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 999px;
        background: rgba(0, 0, 0, .58);
        color: #f4efe0;
        font: 600 12px/1.4 var(--theme-font-body);
        letter-spacing: .06em;
        box-shadow: 0 2px 10px rgba(0, 0, 0, .28);
      }
      .hud-icon {
        display: inline-block;
        width: 18px;
        height: 18px;
        background-image: url('/games/duck-hunt/sprites/effects-atlas.png');
        background-size: 400% 200%;
        background-repeat: no-repeat;
        image-rendering: pixelated;
      }
      .shell { background-position: 0 100%; }
      .shell.spent { background-position: 33.333% 100%; }
      .misses { gap: 0; }
      .miss-mark {
        width: 13px;
        height: 13px;
        opacity: .13;
        background-position: 66.666% 100%;
        transition: opacity 120ms ease;
      }
      .miss-mark.visible { opacity: 1; }
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
        text-shadow: 0 2px 8px rgba(0, 0, 0, .85);
        pointer-events: none;
      }
      .banner span { font: 700 34px/1 var(--theme-font-display); letter-spacing: .1em; }
      .banner small { letter-spacing: .3em; text-transform: uppercase; opacity: .85; }
      .loading { background: rgba(0, 0, 0, .36); }
      .loading span { font-size: 24px; }
      .over { background: rgba(0, 0, 0, .58); pointer-events: auto; }
      .over h2 { margin: 0; font: 700 40px/1 var(--theme-font-display); }
      .over em { color: #ffd76a; font-style: normal; }
      .over button {
        margin-top: 10px;
        padding: 9px 18px;
        border: 1px solid var(--theme-border-strong);
        border-radius: var(--control-radius);
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
  private readonly settings = inject(SettingsService);
  private readonly sfx = inject(AudioFx);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly phase = signal<Phase>('ready');
  readonly assetsReady = signal(false);
  readonly round = signal(1);
  readonly score = signal(0);
  readonly ammo = signal(3);
  readonly misses = signal(0);
  readonly record = signal(false);
  readonly ammoSlots = [0, 1, 2] as const;
  readonly missSlots = Array.from({ length: MISS_CAP }, (_, index) => index);

  private ctx!: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private raf = 0;
  private prev = 0;
  private elapsed = 0;
  private destroyed = false;

  private ducks: Duck[] = [];
  private dog: Dog = { mode: 'hidden', t: 0, x: 0 };
  private readonly aim = new DuckHuntAim();
  private art: LoadedArt = { background: null, duck: null, dog: null, effects: null };
  private impacts: ImpactFx[] = [];
  private shotFx: ShotFx | null = null;
  private spawnDelay = 0;
  private waveInRound = 0;
  private readyTimer = 0;

  private get themeStyle(): DuckHuntThemeStyle {
    return DUCK_HUNT_THEME_STYLES[this.settings.theme()];
  }

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
      this.ctx.imageSmoothingEnabled = false;
      this.aim.setBounds(this.w, this.h);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onMove = (event: PointerEvent) => {
      this.games.gameCursorSuppressed.set(true);
      const rect = canvas.getBoundingClientRect();
      this.aim.setRawPointer(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onDown = (event: PointerEvent) => {
      onMove(event);
      this.shoot();
    };
    const onEnter = () => this.games.gameCursorSuppressed.set(true);
    const onLeave = () => this.games.gameCursorSuppressed.set(false);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerleave', onLeave);

    void this.loadArt();
    const loop = (time: number) => {
      const dt = this.prev ? Math.min((time - this.prev) / 1000, .05) : 0;
      this.prev = time;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      observer.disconnect();
      this.games.gameCursorSuppressed.set(false);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerleave', onLeave);
    });
  }

  restart(): void {
    this.ducks = [];
    this.impacts = [];
    this.shotFx = null;
    this.score.set(0);
    this.misses.set(0);
    this.round.set(1);
    this.record.set(false);
    this.waveInRound = 0;
    this.elapsed = 0;
    this.enterReady();
  }

  private async loadArt(): Promise<void> {
    const style = this.themeStyle;
    const [background, duck, dog, effects] = await Promise.all([
      this.loadImage(style.background),
      this.loadImage(DUCK_HUNT_SPRITES.duck),
      this.loadImage(DUCK_HUNT_SPRITES.dog),
      this.loadImage(DUCK_HUNT_SPRITES.effects),
    ]);
    if (this.destroyed) return;

    this.art = {
      background,
      duck: duck ? this.tintAtlas(duck, style.spriteFilter) : null,
      dog: dog ? this.tintAtlas(dog, style.spriteFilter) : null,
      effects,
    };
    this.assetsReady.set(true);
    this.enterReady();
  }

  private loadImage(source: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = source;
    });
  }

  private tintAtlas(source: HTMLImageElement, filter: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.imageSmoothingEnabled = false;
    context.filter = filter;
    context.drawImage(source, 0, 0);
    return canvas;
  }

  private get groundY(): number {
    return this.h * .8;
  }

  private enterReady(): void {
    this.phase.set('ready');
    this.readyTimer = 1.4;
    this.dog = { mode: 'sniff', t: 0, x: 40 };
  }

  private speed(): number {
    return 90 + this.round() * 16 + Math.min(150, this.elapsed * 2);
  }

  private concurrent(): number {
    return Math.min(1 + Math.floor((this.round() - 1) / 3), 3);
  }

  private spawnWave(): void {
    this.ammo.set(3);
    this.aim.beginWave(this.round());
    const count = this.concurrent();
    for (let index = 0; index < count; index += 1) this.ducks.push(this.spawnDuck());
    this.waveInRound += 1;
  }

  private spawnDuck(): Duck {
    const fromLeft = Math.random() < .5;
    const direction = fromLeft ? 1 : -1;
    const speed = this.speed() * (.7 + Math.random() * .6);
    return {
      x: fromLeft ? -50 : this.w + 50,
      y: 70 + Math.random() * Math.max(40, this.groundY - 165),
      vx: direction * speed,
      vy: -(18 + Math.random() * 28),
      phase: 'fly',
      t: 0,
    };
  }

  private shoot(): void {
    if (!this.assetsReady() || this.phase() !== 'round' || this.ammo() <= 0) return;
    this.ammo.update((value) => value - 1);
    this.sfx.play('shot');

    const shot = this.aim.point();
    this.shotFx = { x: shot.x, y: shot.y, t: 0 };
    let best: Duck | null = null;
    let bestDistance = HIT_RADIUS;
    for (const duck of this.ducks) {
      if (duck.phase !== 'fly') continue;
      const distance = Math.hypot(duck.x - shot.x, duck.y - shot.y);
      if (distance < bestDistance) {
        best = duck;
        bestDistance = distance;
      }
    }

    if (best) {
      best.phase = 'hit';
      best.t = 0;
      this.impacts.push({ x: best.x, y: best.y, t: 0 });
      this.score.update((value) => value + Math.round(100 + this.speed() * .3));
      this.sfx.play('hit');
      this.dog = { mode: 'jump', t: 0, x: best.x };
    }
  }

  private update(dt: number): void {
    if (dt === 0 || !this.assetsReady()) return;
    if (this.phase() !== 'gameover') this.elapsed += dt;
    this.aim.update(dt, this.elapsed, this.round());
    this.updateEffects(dt);
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

    if (this.ammo() <= 0 && this.ducks.some((duck) => duck.phase === 'fly')) {
      for (const duck of this.ducks) if (duck.phase === 'fly') this.flee(duck);
    }

    for (const duck of this.ducks) this.updateDuck(duck, dt);
    this.ducks = this.ducks.filter((duck) => duck.phase !== 'gone');

    if (this.ducks.length === 0) {
      this.spawnDelay -= dt;
      if (this.spawnDelay <= 0) {
        if (this.waveInRound >= WAVES_PER_ROUND) {
          this.round.update((value) => value + 1);
          this.waveInRound = 0;
          this.enterReady();
        } else {
          this.spawnWave();
        }
        this.spawnDelay = .6;
      }
    } else {
      this.spawnDelay = .6;
    }
  }

  private updateEffects(dt: number): void {
    if (this.shotFx) {
      this.shotFx.t += dt;
      if (this.shotFx.t > .16) this.shotFx = null;
    }
    for (const impact of this.impacts) impact.t += dt;
    this.impacts = this.impacts.filter((impact) => impact.t < .42);
  }

  private updateDuck(duck: Duck, dt: number): void {
    duck.t += dt;
    if (duck.phase === 'fly') {
      duck.x += duck.vx * dt;
      duck.y += duck.vy * dt;
      if (duck.y < 40) duck.vy = Math.abs(duck.vy);
      if (duck.y > this.groundY - 45) duck.vy = -Math.abs(duck.vy);
      if (duck.x < 24) { duck.x = 24; duck.vx = Math.abs(duck.vx); }
      if (duck.x > this.w - 24) { duck.x = this.w - 24; duck.vx = -Math.abs(duck.vx); }
      if (duck.t > FLIGHT_TIME) this.flee(duck);
    } else if (duck.phase === 'hit' && duck.t > .16) {
      duck.phase = 'fall';
      duck.t = 0;
      duck.vy = 0;
    } else if (duck.phase === 'fall') {
      duck.vy += 900 * dt;
      duck.y += duck.vy * dt;
      if (duck.y > this.groundY + 50) duck.phase = 'gone';
    } else if (duck.phase === 'flee') {
      duck.y -= 320 * dt;
      duck.x += duck.vx * .3 * dt;
      if (duck.y < -50) duck.phase = 'gone';
    }
  }

  private flee(duck: Duck): void {
    if (duck.phase === 'flee') return;
    duck.phase = 'flee';
    duck.t = 0;
    this.misses.update((value) => value + 1);
    this.sfx.play('quack');
    this.dog = { mode: 'laugh', t: 0, x: duck.x };
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
      dog.x = 40 + (this.w * .5 - 40) * Math.min(1, dog.t / 1.4);
    } else if (dog.mode === 'jump' && dog.t > .82) {
      dog.mode = 'hidden';
    } else if (dog.mode === 'laugh' && dog.t > 1.05) {
      dog.mode = 'hidden';
    }
  }

  private draw(): void {
    const context = this.ctx;
    const { w, h } = this;
    context.clearRect(0, 0, w, h);
    this.drawEnvironment(context);

    if (!this.assetsReady()) return;
    for (const duck of this.ducks) this.drawDuck(context, duck);
    this.drawDog(context);
    this.drawEffects(context);
    if (this.phase() !== 'gameover') this.drawCrosshair(context);
  }

  private drawEnvironment(context: CanvasRenderingContext2D): void {
    if (this.art.background) {
      context.drawImage(this.art.background, 0, 0, this.w, this.h);
      return;
    }

    const sky = context.createLinearGradient(0, 0, 0, this.groundY);
    sky.addColorStop(0, '#111a31');
    sky.addColorStop(1, '#536a95');
    context.fillStyle = sky;
    context.fillRect(0, 0, this.w, this.groundY);
    context.fillStyle = '#304b24';
    context.fillRect(0, this.groundY, this.w, this.h - this.groundY);
  }

  private drawDuck(context: CanvasRenderingContext2D, duck: Duck): void {
    if (!this.art.duck) {
      this.drawFallbackDuck(context, duck);
      return;
    }

    let frame: number;
    if (duck.phase === 'hit') frame = DUCK_FRAMES.hit;
    else if (duck.phase === 'fall') {
      frame = Math.floor(duck.t * 7) % 2 ? DUCK_FRAMES.fallTwo : DUCK_FRAMES.fallOne;
    } else if (duck.phase === 'flee') {
      frame = Math.floor(duck.t * 9) % 2 ? DUCK_FRAMES.fleeDown : DUCK_FRAMES.fleeUp;
    } else {
      frame = [DUCK_FRAMES.flyUp, DUCK_FRAMES.flyLevel, DUCK_FRAMES.flyDown][Math.floor(duck.t * 10) % 3];
    }

    this.drawAtlasFrame(
      context,
      this.art.duck,
      frame,
      duck.x,
      duck.y,
      DUCK_SIZE,
      duck.vx > 0,
      this.themeStyle.glow,
    );
  }

  private drawDog(context: CanvasRenderingContext2D): void {
    const dog = this.dog;
    if (dog.mode === 'hidden') return;
    if (!this.art.dog) {
      this.drawFallbackDog(context, dog);
      return;
    }

    let frame: number;
    let y = this.groundY - DOG_SIZE * .31;
    if (dog.mode === 'sniff') {
      frame = [DOG_FRAMES.sniffOne, DOG_FRAMES.sniffTwo, DOG_FRAMES.sniffThree][Math.floor(dog.t * 8) % 3];
    } else if (dog.mode === 'jump') {
      const progress = Math.min(1, dog.t / .82);
      y -= Math.sin(progress * Math.PI) * 82;
      frame = progress > .5 ? DOG_FRAMES.retrieve : progress > .25 ? DOG_FRAMES.jumpTwo : DOG_FRAMES.jumpOne;
    } else {
      const progress = Math.min(1, dog.t / 1.05);
      y -= Math.sin(progress * Math.PI) * 48;
      frame = Math.floor(dog.t * 8) % 2 ? DOG_FRAMES.laughTwo : DOG_FRAMES.laughOne;
    }

    this.drawAtlasFrame(context, this.art.dog, frame, dog.x, y, DOG_SIZE, false, this.themeStyle.glow);
  }

  private drawEffects(context: CanvasRenderingContext2D): void {
    if (!this.art.effects) return;
    if (this.shotFx) {
      const alpha = 1 - this.shotFx.t / .16;
      this.drawAtlasFrame(
        context,
        this.art.effects,
        EFFECT_FRAMES.muzzle,
        this.shotFx.x,
        this.shotFx.y,
        68 + this.shotFx.t * 80,
        false,
        this.themeStyle.accent,
        alpha,
      );
    }
    for (const impact of this.impacts) {
      const alpha = 1 - impact.t / .42;
      const frame = impact.t < .2 ? EFFECT_FRAMES.feathers : EFFECT_FRAMES.hit;
      this.drawAtlasFrame(
        context,
        this.art.effects,
        frame,
        impact.x,
        impact.y,
        82 + impact.t * 55,
        false,
        this.themeStyle.glow,
        alpha,
      );
    }
  }

  private drawAtlasFrame(
    context: CanvasRenderingContext2D,
    atlas: AtlasSource,
    frame: number,
    x: number,
    y: number,
    size: number,
    flip: boolean,
    glow: string,
    alpha = 1,
  ): void {
    const cellWidth = atlas.width / ATLAS_COLUMNS;
    const cellHeight = atlas.height / ATLAS_ROWS;
    const sourceX = (frame % ATLAS_COLUMNS) * cellWidth;
    const sourceY = Math.floor(frame / ATLAS_COLUMNS) * cellHeight;

    context.save();
    context.translate(x, y);
    context.scale(flip ? -1 : 1, 1);
    context.globalAlpha = alpha;
    context.shadowColor = glow;
    context.shadowBlur = 7;
    context.drawImage(
      atlas,
      sourceX,
      sourceY,
      cellWidth,
      cellHeight,
      -size / 2,
      -size / 2,
      size,
      size,
    );
    context.restore();
  }

  private drawCrosshair(context: CanvasRenderingContext2D): void {
    const { x, y } = this.aim.point();
    const { accent, glow } = this.themeStyle;
    context.save();
    context.strokeStyle = accent;
    context.fillStyle = accent;
    context.lineWidth = 2;
    context.shadowColor = glow;
    context.shadowBlur = 11;
    context.beginPath();
    context.arc(x, y, 13, 0, Math.PI * 2);
    context.arc(x, y, 3, 0, Math.PI * 2);
    context.moveTo(x - 23, y);
    context.lineTo(x - 7, y);
    context.moveTo(x + 7, y);
    context.lineTo(x + 23, y);
    context.moveTo(x, y - 23);
    context.lineTo(x, y - 7);
    context.moveTo(x, y + 7);
    context.lineTo(x, y + 23);
    context.stroke();
    context.globalAlpha = .82;
    context.fillRect(x - 1, y - 1, 2, 2);
    context.restore();
  }

  private drawFallbackDuck(context: CanvasRenderingContext2D, duck: Duck): void {
    context.save();
    context.translate(duck.x, duck.y);
    context.scale(duck.vx > 0 ? -1 : 1, 1);
    context.fillStyle = '#e9d8a7';
    context.beginPath();
    context.ellipse(0, 0, 22, 13, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#248b84';
    context.beginPath();
    context.arc(-18, -8, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f6a623';
    context.fillRect(-32, -9, 10, 4);
    context.restore();
  }

  private drawFallbackDog(context: CanvasRenderingContext2D, dog: Dog): void {
    context.save();
    context.fillStyle = '#a95f2a';
    context.fillRect(dog.x - 28, this.groundY - 48, 55, 28);
    context.fillStyle = '#eed4a3';
    context.fillRect(dog.x + 16, this.groundY - 43, 22, 20);
    context.restore();
  }
}
