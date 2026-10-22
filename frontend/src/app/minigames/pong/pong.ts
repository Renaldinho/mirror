import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener,
  NgZone, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { PetService } from '../../dashboard/pet.service';
import { AlarmService } from '../../widgets/alarm.service';
import { UiIcon } from '../../shared/ui-icon';
import { AudioFx } from '../audio';
import { GamesService } from '../games.service';
import { BALL_RADIUS, COURT_HEIGHT, COURT_WIDTH, PADDLE_INSET, PADDLE_WIDTH,
  PONG_MODES, PongCue, PongDifficulty, PongEngine, WINNING_SCORE } from './pong-engine';

const STEP = 1 / 120;
const DIFFICULTY_KEY = 'dash.pong.difficulty';

@Component({
  selector: 'app-pong',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="hud">
        <span class="score you">You <strong>{{ playerScore() }}</strong></span>
        <span class="versus">
          @if (pets.kind(); as kind) {
            <span [class]="'avatar ' + kind.sprite.cssClass"
              [style.background-size]="(kind.sprite.columns * 100) + '% ' + (kind.sprite.rows * 100) + '%'"
              aria-hidden="true"></span>
          }
          First to {{ winningScore }}
        </span>
        <span class="score opponent"><strong>{{ aiScore() }}</strong> {{ opponent() }}</span>
        @if (phase() === 'play') {
          <button type="button" class="pause" aria-label="Pause Pong" (click)="pause()"><app-ui-icon name="pause" /></button>
        }
      </div>
      <div class="court-wrap">
        <svg #court class="court" [attr.viewBox]="portrait() ? '0 0 600 1000' : '0 0 1000 600'"
          tabindex="0" role="application" aria-label="Pong court. Move the pointer or use arrow keys to move your paddle. Press P to pause.">
          <g [attr.transform]="portrait() ? 'translate(0 1000) rotate(-90)' : null">
            <rect width="1000" height="600" rx="10" class="court-bg" />
            <path d="M500 16v568" class="net" />
            <rect #player [attr.x]="paddleInset" [attr.width]="paddleWidth"
              [attr.height]="model.mode.playerHeight" rx="5" class="player" />
            <rect #computer [attr.x]="courtWidth - paddleInset - paddleWidth" [attr.width]="paddleWidth"
              [attr.height]="model.mode.aiHeight" rx="5" class="computer" />
            <circle #ball [attr.r]="ballRadius" class="ball" />
          </g>
        </svg>
        @if (phase() !== 'play') {
          <div class="scrim">
            <section class="menu" [attr.aria-label]="phase() === 'paused' ? 'Pong paused' : 'Pong match'">
              <h2>{{ phase() === 'setup' ? 'Pong' : phase() === 'paused' ? 'Paused' : playerScore() >= winningScore ? 'You win!' : opponent() + ' wins!' }}</h2>
              @if (phase() !== 'paused') {
                <p>Challenge {{ opponent() }}. First to {{ winningScore }} wins.</p>
                <div class="difficulties" role="group" aria-label="Pong difficulty">
                  @for (mode of difficulties; track mode.id) {
                    <button type="button" [attr.aria-pressed]="difficulty() === mode.id"
                      [class.selected]="difficulty() === mode.id" (click)="selectDifficulty(mode.id)">{{ mode.label }}</button>
                  }
                </div>
                @if (phase() === 'over') {
                  <p>Longest rally: {{ bestRally() }} @if (record()) { <strong>New record!</strong> }</p>
                }
                <button type="button" class="primary" (click)="start()">{{ phase() === 'over' ? 'Play again' : 'Start match' }}</button>
              } @else {
                <p>The match is paused.</p>
                <button type="button" class="primary" (click)="resume()">Resume match</button>
              }
              <p class="help">{{ portrait() ? 'Move left/right' : 'Move up/down' }} with your mouse, controller pointer, touch, or arrow keys. P or Space pauses.</p>
            </section>
          </div>
        }
      </div>
      <div class="footer" role="status">
        <span>Rally {{ rally() }}</span>
        <span>Best rally {{ games.highScore('pong') }}</span>
        <span>{{ difficultyLabel() }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .wrap { height: 100%; display: flex; flex-direction: column; gap: 10px; padding: clamp(10px, 2vmin, 24px); }
    .hud, .footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; }
    .hud { color: var(--theme-text); font-size: clamp(13px, 1.7vmin, 22px); }
    .score { display: flex; align-items: center; gap: 12px; min-width: 0; overflow-wrap: anywhere; }
    .score strong { font: 700 clamp(24px, 4vmin, 48px)/1 var(--theme-font-display); }
    .you { color: #9ee8d2; } .opponent { color: #eebc7d; }
    .versus { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--theme-text-muted); white-space: nowrap; font-size: 12px; }
    .avatar { display: block; flex-shrink: 0; width: 36px; height: 36px; background-repeat: no-repeat; image-rendering: pixelated; }
    .pause { display: grid; place-items: center; min-width: 44px; min-height: 44px; font-size: 20px; }
    .court-wrap { position: relative; flex: 1; min-height: 0; }
    .court { display: block; width: 100%; height: 100%; touch-action: none; }
    .court:focus-visible { outline: 2px solid var(--theme-focus); outline-offset: -2px; }
    .court-bg { fill: #080e14; stroke: var(--theme-border-strong); stroke-width: 2; }
    .net { stroke: #617780; stroke-width: 3; stroke-dasharray: 10 14; opacity: .5; }
    .player { fill: #9ee8d2; } .computer { fill: #eebc7d; } .ball { fill: #fff; }
    .scrim { position: absolute; inset: 0; display: grid; place-items: center; overflow: auto; padding: 12px; background: rgba(0, 0, 0, .5); }
    .menu { max-width: 430px; padding: clamp(16px, 3vmin, 30px); text-align: center; border: 1px solid var(--theme-border-strong); border-radius: var(--panel-radius); background: var(--theme-panel-opaque); color: var(--theme-text); }
    h2 { margin: 0 0 12px; font: 700 clamp(28px, 5vmin, 48px)/1 var(--theme-font-display); }
    p { margin: 10px 0; font-size: 14px; } .help { color: var(--theme-text-muted); font-size: 12px; line-height: 1.5; }
    .difficulties { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 16px 0; }
    button { padding: 10px 14px; min-height: 44px; border: 1px solid var(--theme-border); border-radius: var(--control-radius); background: var(--theme-control-bg); color: var(--theme-text); cursor: pointer; }
    button:hover { background: var(--theme-surface-hover); border-color: var(--theme-primary); }
    button.selected, button.primary { border-color: var(--theme-primary); background: var(--theme-primary-soft); color: var(--theme-primary-bright); }
    button.primary:hover { background: var(--theme-surface-hover); }
    button:focus-visible { outline: 2px solid var(--theme-focus); outline-offset: 3px; }
    .footer { color: var(--theme-text-muted); font-size: 12px; }
    @media (max-width: 420px) { .avatar { display: none; } .score { gap: 6px; } .versus { font-size: 10px; } }
  `],
})
export class Pong implements AfterViewInit {
  readonly games = inject(GamesService);
  readonly pets = inject(PetService);
  private readonly sfx = inject(AudioFx);
  private readonly alarm = inject(AlarmService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly court = viewChild.required<ElementRef<SVGSVGElement>>('court');
  private readonly player = viewChild.required<ElementRef<SVGRectElement>>('player');
  private readonly computer = viewChild.required<ElementRef<SVGRectElement>>('computer');
  private readonly ball = viewChild.required<ElementRef<SVGCircleElement>>('ball');
  readonly winningScore = WINNING_SCORE;
  readonly paddleInset = PADDLE_INSET;
  readonly paddleWidth = PADDLE_WIDTH;
  readonly courtWidth = COURT_WIDTH;
  readonly ballRadius = BALL_RADIUS;
  readonly phase = signal<'setup' | 'play' | 'paused' | 'over'>('setup');
  readonly portrait = signal(false);
  readonly playerScore = signal(0);
  readonly aiScore = signal(0);
  readonly rally = signal(0);
  readonly bestRally = signal(0);
  readonly record = signal(false);
  readonly difficulty = signal<PongDifficulty>(this.loadDifficulty());
  readonly difficulties = (Object.keys(PONG_MODES) as PongDifficulty[]).map((id) => ({ id, label: PONG_MODES[id].label }));
  readonly difficultyLabel = computed(() => PONG_MODES[this.difficulty()].label);
  readonly opponent = computed(() => this.pets.activeName() || this.pets.kind()?.label || 'Computer');
  model = new PongEngine(this.difficulty());
  private target = COURT_HEIGHT / 2;
  private keys = new Set<string>();
  private frame = 0;
  private lastTime = 0;
  private accumulator = 0;
  private bounds = { left: 0, top: 0, width: 1000, height: 600 };

  constructor() {
    effect(() => { if (this.alarm.ringing()) this.pause(); });
  }

  ngAfterViewInit(): void {
    const resize = () => {
      const rect = this.court().nativeElement.getBoundingClientRect();
      this.bounds = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      this.zone.run(() => this.portrait.set(rect.height > rect.width));
      this.draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(this.court().nativeElement);
    resize();
    const court = this.court().nativeElement;
    const move = (event: PointerEvent) => this.point(event);
    const grab = (event: PointerEvent) => this.grab(event);
    this.zone.runOutsideAngular(() => {
      court.addEventListener('pointermove', move, { passive: true });
      court.addEventListener('pointerdown', grab, { passive: true });
    });
    this.destroyRef.onDestroy(() => {
      observer.disconnect(); this.stop();
      court.removeEventListener('pointermove', move);
      court.removeEventListener('pointerdown', grab);
    });
  }

  selectDifficulty(id: PongDifficulty): void {
    this.difficulty.set(id);
    localStorage.setItem(DIFFICULTY_KEY, id);
  }

  start(): void {
    this.stop();
    this.model = new PongEngine(this.difficulty());
    this.target = COURT_HEIGHT / 2;
    this.record.set(false);
    this.bestRally.set(0);
    this.syncScore();
    this.sfx.play('start');
    this.resume();
  }

  pause(): void {
    if (this.phase() !== 'play') return;
    this.phase.set('paused');
    this.stop();
  }

  resume(): void {
    if (this.alarm.ringing()) return;
    this.phase.set('play');
    this.lastTime = 0;
    this.accumulator = 0;
    this.court().nativeElement.focus({ preventScroll: true });
    this.zone.runOutsideAngular(() => { this.frame = requestAnimationFrame(this.animate); });
  }

  point(event: PointerEvent): void {
    if (this.phase() !== 'play') return;
    const { left, top, width, height } = this.bounds;
    const viewWidth = this.portrait() ? COURT_HEIGHT : COURT_WIDTH;
    const viewHeight = this.portrait() ? COURT_WIDTH : COURT_HEIGHT;
    const scale = Math.min(width / viewWidth, height / viewHeight);
    if (scale <= 0) return;
    // Account for SVG letterboxing; never read layout on every pointer move.
    this.target = this.portrait()
      ? (event.clientX - left - (width - viewWidth * scale) / 2) / scale
      : (event.clientY - top - (height - viewHeight * scale) / 2) / scale;
  }

  grab(event: PointerEvent): void {
    this.point(event);
    if (this.phase() === 'play') this.court().nativeElement.setPointerCapture?.(event.pointerId);
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 's', 'a', 'd'].includes(key)) {
      if (this.phase() !== 'play') return;
      event.preventDefault();
      this.keys.add(key);
    } else if ((key === 'p' || key === ' ') && !event.repeat && !(event.target instanceof HTMLButtonElement)) {
      if (this.phase() !== 'play' && this.phase() !== 'paused') return;
      event.preventDefault();
      if (this.phase() === 'play') this.pause(); else this.resume();
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent): void { this.keys.delete(event.key.toLowerCase()); }

  @HostListener('window:blur')
  blur(): void { this.pause(); }

  @HostListener('document:visibilitychange')
  visibility(): void { if (document.hidden) this.pause(); }

  private readonly animate = (time: number): void => {
    if (this.phase() !== 'play') return;
    if (this.lastTime) this.accumulator += Math.min(.05, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    while (this.accumulator >= STEP && this.phase() === 'play') {
      const direction = this.portrait()
        ? Number(this.keys.has('arrowright') || this.keys.has('d')) - Number(this.keys.has('arrowleft') || this.keys.has('a'))
        : Number(this.keys.has('arrowdown') || this.keys.has('s')) - Number(this.keys.has('arrowup') || this.keys.has('w'));
      if (direction) this.target = this.model.playerY + direction * 900 * STEP;
      const cue = this.model.step(STEP, this.target);
      if (cue) this.zone.run(() => this.handleCue(cue));
      this.accumulator -= STEP;
    }
    this.draw();
    if (this.phase() === 'play') this.frame = requestAnimationFrame(this.animate);
  };

  private handleCue(cue: PongCue): void {
    this.syncScore();
    if (this.model.bestRally > this.games.highScore('pong')) {
      this.record.set(this.games.submitScore('pong', this.model.bestRally) || this.record());
    }
    if (cue === 'win' || cue === 'lose') {
      this.phase.set('over');
      this.stop();
      this.sfx.play(cue === 'win' ? 'record' : 'gameover');
    } else this.sfx.play(cue === 'bounce' ? 'bounce' : cue === 'wall' ? 'pop' : cue === 'player-point' ? 'point' : 'miss');
  }

  private syncScore(): void {
    this.playerScore.set(this.model.playerScore);
    this.aiScore.set(this.model.aiScore);
    this.rally.set(this.model.rally);
    this.bestRally.set(this.model.bestRally);
  }

  private draw(): void {
    this.player().nativeElement.setAttribute('y', String(this.model.playerY - this.model.mode.playerHeight / 2));
    this.computer().nativeElement.setAttribute('y', String(this.model.aiY - this.model.mode.aiHeight / 2));
    this.ball().nativeElement.setAttribute('cx', String(this.model.ball.x));
    this.ball().nativeElement.setAttribute('cy', String(this.model.ball.y));
  }

  private stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.keys.clear();
  }

  private loadDifficulty(): PongDifficulty {
    const value = localStorage.getItem(DIFFICULTY_KEY);
    return value === 'normal' || value === 'hard' ? value : 'easy';
  }
}
