import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { CursorFxMode, SettingsService } from './settings.service';

type SparkKind = 'orb' | 'diamond' | 'bubble' | 'glyph' | 'flame';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  kind: SparkKind;
  glyph?: string;
  diamond?: boolean;
}

/**
 * A deliberately nostalgic cursor: laser reticle, chromatic comet dust, and
 * click sparkles. It reacts to any device that emits mouse-like PointerEvents.
 */
@Component({
  selector: 'app-retro-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #trail class="trail" aria-hidden="true"></canvas>
    <div #cursor class="retro-pointer" [attr.data-mode]="settings.cursorFxMode()" aria-hidden="true">
      <div class="pointer-shape">
        <span class="orbit"></span>
        <span class="reticle"></span>
        <span class="laser-core"></span>
        <span class="satellite one"></span>
        <span class="satellite two"></span>
        <span class="mode-icon"></span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        pointer-events: none;
      }
      .trail {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
      }
      .retro-pointer {
        position: fixed;
        top: 0;
        left: 0;
        width: 34px;
        height: 34px;
        opacity: 0;
        pointer-events: none;
        will-change: transform;
      }
      .retro-pointer.visible {
        opacity: 1;
      }
      .pointer-shape {
        position: absolute;
        inset: 0;
        transition: transform 90ms ease;
      }
      .retro-pointer.pressed .pointer-shape {
        transform: scale(.72) rotate(45deg);
      }
      .orbit {
        position: absolute;
        inset: 3px;
        border: 1px solid color-mix(in srgb, var(--theme-primary-bright) 82%, #69faff);
        border-top-color: #ff68d8;
        border-right-color: transparent;
        border-radius: 50%;
        filter: drop-shadow(0 0 4px var(--theme-primary));
        animation: orbit-spin 1.35s linear infinite;
      }
      .reticle::before,
      .reticle::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        background: color-mix(in srgb, var(--theme-primary-bright) 76%, #fff);
        box-shadow: 0 0 5px currentColor;
        transform: translate(-50%, -50%);
      }
      .reticle::before {
        width: 30px;
        height: 1px;
        clip-path: polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 65% 0, 100% 0, 100% 100%, 65% 100%, 65% 0);
      }
      .reticle::after {
        width: 1px;
        height: 30px;
        clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%, 0 0, 0 65%, 100% 65%, 100% 100%, 0 100%);
      }
      .laser-core {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 5px;
        height: 5px;
        border: 1px solid #fff;
        border-radius: 50%;
        background: #ff2d75;
        box-shadow:
          0 0 4px #fff,
          0 0 9px #ff2d75,
          0 0 16px #ff2d75;
        transform: translate(-50%, -50%);
      }
      .satellite {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #fff;
        box-shadow: 0 0 7px #69faff;
        transform: rotate(45deg);
      }
      .satellite.one {
        right: 0;
        top: 3px;
        animation: satellite-pulse 850ms ease-in-out infinite alternate;
      }
      .satellite.two {
        bottom: 1px;
        left: 4px;
        width: 3px;
        height: 3px;
        background: #ff68d8;
        animation: satellite-pulse 680ms 180ms ease-in-out infinite alternate-reverse;
      }
      .mode-icon {
        display: none;
      }
      .retro-pointer[data-mode='glitter'] .orbit {
        display: none;
      }
      .retro-pointer[data-mode='glitter'] .reticle,
      .retro-pointer[data-mode='glitter'] .laser-core,
      .retro-pointer[data-mode='glitter'] .satellite {
        display: none;
      }
      .retro-pointer[data-mode='glitter'] .mode-icon {
        position: absolute;
        inset: -5px;
        display: grid;
        place-items: center;
        color: #fff;
        font: 400 32px/1 serif;
        text-shadow:
          0 0 4px #fff,
          0 0 9px #ff7df3,
          0 0 16px #7df9ff,
          0 0 23px #ff7df3;
        animation: glitter-wand 780ms ease-in-out infinite alternate;
      }
      .retro-pointer[data-mode='glitter'] .mode-icon::before {
        content: '✦';
      }
      .retro-pointer[data-mode='glitter'] .mode-icon::after {
        content: '✧';
        position: absolute;
        right: 0;
        top: 0;
        color: #ffe36e;
        font-size: 13px;
        animation: satellite-pulse 560ms ease-in-out infinite alternate-reverse;
      }
      .retro-pointer[data-mode='matrix'] .orbit {
        inset: 5px;
        border-color: #65ff73;
        border-right-color: transparent;
        border-radius: 2px;
        filter: drop-shadow(0 0 5px #00ff41);
      }
      .retro-pointer[data-mode='matrix'] .reticle::before,
      .retro-pointer[data-mode='matrix'] .reticle::after {
        background: #65ff73;
        box-shadow: 0 0 6px #00ff41;
      }
      .retro-pointer[data-mode='matrix'] .laser-core {
        border-color: #baffc1;
        border-radius: 1px;
        background: #00ff41;
        box-shadow: 0 0 5px #baffc1, 0 0 14px #00ff41;
      }
      .retro-pointer[data-mode='flame'] .orbit {
        border-color: #ffdb4d #ff4d00 transparent #ff8a00;
        filter: drop-shadow(0 0 6px #ff4d00);
        animation-duration: .75s;
      }
      .retro-pointer[data-mode='flame'] .reticle::before,
      .retro-pointer[data-mode='flame'] .reticle::after {
        background: #ffb000;
        box-shadow: 0 0 6px #ff4d00;
      }
      .retro-pointer[data-mode='flame'] .laser-core {
        background: #fff08a;
        box-shadow: 0 0 4px #fff, 0 0 10px #ffb000, 0 0 18px #ff4d00;
      }
      .retro-pointer[data-mode='bubbles'] .orbit {
        inset: 2px;
        border: 2px solid rgba(128, 238, 255, .82);
        border-right-color: rgba(255, 139, 231, .7);
        filter: drop-shadow(0 0 5px #77eaff);
        animation-direction: reverse;
        animation-duration: 2.2s;
      }
      .retro-pointer[data-mode='bubbles'] .reticle::before,
      .retro-pointer[data-mode='bubbles'] .reticle::after {
        opacity: .3;
      }
      .retro-pointer[data-mode='bubbles'] .laser-core {
        width: 7px;
        height: 7px;
        border-color: #fff;
        background: rgba(105, 250, 255, .22);
        box-shadow: inset 2px 2px 2px #fff, 0 0 9px #69faff, 0 0 15px #ff8be7;
      }
      @keyframes orbit-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes satellite-pulse {
        from { opacity: .35; transform: rotate(45deg) scale(.55); }
        to { opacity: 1; transform: rotate(45deg) scale(1.35); }
      }
      @keyframes glitter-wand {
        from { transform: rotate(-12deg) scale(.84); }
        to { transform: rotate(10deg) scale(1.08); }
      }
      @media (prefers-reduced-motion: reduce), (any-pointer: coarse) {
        :host { display: none; }
      }
    `,
  ],
})
export class RetroCursor implements AfterViewInit {
  readonly settings = inject(SettingsService);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trail = viewChild.required<ElementRef<HTMLCanvasElement>>('trail');
  private readonly cursor = viewChild.required<ElementRef<HTMLElement>>('cursor');

  private readonly sparks: Spark[] = [];
  private readonly window = this.document.defaultView;
  private readonly finePointer = this.window?.matchMedia
    ? this.window.matchMedia('(any-pointer: fine)')
    : null;
  private readonly reducedMotion = this.window?.matchMedia
    ? this.window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  private context: CanvasRenderingContext2D | null = null;
  private frame = 0;
  private lastFrame = 0;
  private lastX = 0;
  private lastY = 0;
  private hasPosition = false;
  private viewReady = false;
  private active = false;
  private paletteKey = '';
  private paletteValue: string[] = [];

  constructor() {
    effect(() => {
      this.settings.cursorFx();
      if (this.viewReady) this.refresh();
    });
  }

  ngAfterViewInit(): void {
    if (!this.window) return;

    this.viewReady = true;
    this.context = this.trail().nativeElement.getContext('2d');

    this.zone.runOutsideAngular(() => {
      this.window!.addEventListener('pointermove', this.onPointerMove, { passive: true });
      this.window!.addEventListener('pointerdown', this.onPointerDown, { passive: true });
      this.window!.addEventListener('pointerup', this.onPointerUp, { passive: true });
      this.window!.addEventListener('pointercancel', this.onPointerUp, { passive: true });
      this.window!.addEventListener('pointerout', this.onPointerOut, { passive: true });
      this.window!.addEventListener('resize', this.resize, { passive: true });
      this.finePointer?.addEventListener('change', this.refresh);
      this.reducedMotion?.addEventListener('change', this.refresh);
      this.refresh();
    });

    this.destroyRef.onDestroy(() => this.destroy());
  }

  private readonly refresh = (): void => {
    if (!this.viewReady || !this.window) return;

    const shouldRun =
      this.settings.cursorFx() &&
      (this.finePointer?.matches ?? false) &&
      !(this.reducedMotion?.matches ?? false);

    if (shouldRun === this.active) return;
    this.active = shouldRun;

    if (this.active) {
      this.resize();
      this.lastFrame = performance.now();
      this.frame = this.window.requestAnimationFrame(this.animate);
    } else {
      this.cursor().nativeElement.classList.remove('visible', 'pressed');
      this.sparks.length = 0;
      this.clearCanvas();
      this.stopAnimation();
      this.hasPosition = false;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.active || event.pointerType === 'touch') return;

    const element = this.cursor().nativeElement;
    element.style.transform = `translate3d(${event.clientX - 17}px, ${event.clientY - 17}px, 0)`;
    element.classList.add('visible');

    if (this.hasPosition) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      const distance = Math.hypot(dx, dy);
      const count = Math.min(4, Math.max(1, Math.floor(distance / 9)));

      for (let index = 0; index < count; index += 1) {
        const progress = (index + 1) / count;
        this.spawnTrail(this.lastX + dx * progress, this.lastY + dy * progress, dx, dy);
      }
    }

    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.hasPosition = true;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.active || event.pointerType === 'touch') return;

    this.cursor().nativeElement.classList.add('pressed');
    const mode = this.settings.cursorFxMode();
    const palette = this.palette();
    for (let index = 0; index < 22; index += 1) {
      const angle = (Math.PI * 2 * index) / 22 + Math.random() * .16;
      const speed = 1.8 + Math.random() * 3.8;
      this.sparks.push({
        x: event.clientX,
        y: event.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 28 + Math.random() * 18,
        ttl: 46,
        size: 1.5 + Math.random() * 2.8,
        color: palette[index % palette.length],
        kind: this.sparkKind(mode, index, true),
        glyph: this.sparkGlyph(mode, index),
      });
    }
  };

  private readonly onPointerUp = (): void => {
    if (!this.viewReady) return;
    this.cursor().nativeElement.classList.remove('pressed');
  };

  private readonly onPointerOut = (event: PointerEvent): void => {
    if (event.relatedTarget !== null || !this.viewReady) return;
    this.cursor().nativeElement.classList.remove('visible', 'pressed');
    this.hasPosition = false;
  };

  private spawnTrail(x: number, y: number, dx: number, dy: number): void {
    const mode = this.settings.cursorFxMode();
    const palette = this.palette();
    const drift = Math.atan2(dy, dx) + Math.PI + (Math.random() - .5) * 1.6;
    const speed = .25 + Math.random() * 1.15;
    const density = mode === 'glitter' || mode === 'flame' ? 2 : 1;

    for (let index = 0; index < density; index += 1) {
      let vx = Math.cos(drift) * speed;
      let vy = Math.sin(drift) * speed - .12;
      if (mode === 'matrix') {
        vx = (Math.random() - .5) * .24;
        vy = .45 + Math.random() * .75;
      } else if (mode === 'glitter') {
        vx = (Math.random() - .5) * 1.15;
        vy = -.15 - Math.random() * .85;
      } else if (mode === 'flame') {
        vx = (Math.random() - .5) * .55;
        vy = -.65 - Math.random() * 1.15;
      } else if (mode === 'bubbles') {
        vx = (Math.random() - .5) * .5;
        vy = -.2 - Math.random() * .45;
      }

      this.sparks.push({
        x: x + (Math.random() - .5) * 7,
        y: y + (Math.random() - .5) * 7,
        vx,
        vy,
        life: 18 + Math.random() * 17,
        ttl: 35,
        size: .8 + Math.random() * (mode === 'bubbles' ? 3.5 : 2.1),
        color: palette[Math.floor(Math.random() * palette.length)],
        kind: this.sparkKind(mode, Math.floor(Math.random() * 12), false),
        glyph: this.sparkGlyph(mode, Math.floor(Math.random() * 12)),
      });
    }

    if (this.sparks.length > 180) {
      this.sparks.splice(0, this.sparks.length - 180);
    }
  }

  private palette(): string[] {
    const mode = this.settings.cursorFxMode();
    const key = `${this.settings.theme()}:${mode}`;
    if (this.paletteKey === key) return this.paletteValue;

    const styles = getComputedStyle(this.document.documentElement);
    const themeBright = styles.getPropertyValue('--theme-primary-bright').trim() || '#fff4b5';
    const themePrimary = styles.getPropertyValue('--theme-primary').trim() || '#ffd166';
    let palette: string[];

    switch (mode) {
      case 'glitter':
        palette = ['#fff', '#ffe36e', '#ff7df3', '#7df9ff', themeBright];
        break;
      case 'matrix':
        palette = ['#d4ffcf', '#65ff73', '#00ff41', '#0abf38'];
        break;
      case 'flame':
        palette = ['#fff4a8', '#ffd000', '#ff8a00', '#ff3d00', '#d41414'];
        break;
      case 'bubbles':
        palette = ['#fff', '#a9f6ff', '#69dfff', '#a78bfa', '#ff8be7'];
        break;
      default:
        palette = [themeBright, themePrimary, '#69faff', '#ff68d8', '#fff'];
    }

    this.paletteKey = key;
    this.paletteValue = palette;
    return palette;
  }

  private sparkKind(mode: CursorFxMode, index: number, burst: boolean): SparkKind {
    switch (mode) {
      case 'glitter':
        return 'glyph';
      case 'matrix':
        return 'glyph';
      case 'flame':
        return index % 5 === 0 && burst ? 'diamond' : 'flame';
      case 'bubbles':
        return index % 6 === 0 && burst ? 'diamond' : 'bubble';
      default:
        return burst && index % 4 === 0 ? 'diamond' : 'orb';
    }
  }

  private sparkGlyph(mode: CursorFxMode, index: number): string | undefined {
    if (mode === 'matrix') return index % 2 ? '1' : '0';
    if (mode === 'glitter') return ['✦', '★', '✧', '♡', '+'][index % 5];
    return undefined;
  }

  private readonly animate = (time: number): void => {
    if (!this.active || !this.window || !this.context) return;

    const delta = Math.min(2, Math.max(.4, (time - this.lastFrame) / 16.667));
    this.lastFrame = time;
    const context = this.context;
    const canvas = this.trail().nativeElement;
    const scale = Math.min(this.window.devicePixelRatio || 1, 2);

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
    context.globalCompositeOperation = 'lighter';

    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];
      spark.life -= delta;
      if (spark.life <= 0) {
        this.sparks.splice(index, 1);
        continue;
      }

      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      spark.vx *= Math.pow(.97, delta);
      spark.vy = spark.vy * Math.pow(.97, delta) + .018 * delta;

      const alpha = Math.min(1, spark.life / Math.min(14, spark.ttl));
      const size = spark.size * (.55 + spark.life / spark.ttl);
      context.globalAlpha = alpha;
      context.fillStyle = spark.color;
      context.shadowColor = spark.color;
      context.shadowBlur = size * 3.5;

      switch (spark.kind) {
        case 'diamond':
          this.drawDiamond(context, spark.x, spark.y, size);
          break;
        case 'bubble':
          context.lineWidth = Math.max(.65, size * .3);
          context.strokeStyle = spark.color;
          context.beginPath();
          context.arc(spark.x, spark.y, size * 1.7, 0, Math.PI * 2);
          context.stroke();
          break;
        case 'glyph':
          const binary = spark.glyph === '0' || spark.glyph === '1';
          context.font = `${binary ? 700 : 400} ${Math.max(8, size * (binary ? 4.3 : 5.2))}px ${binary ? 'monospace' : 'serif'}`;
          context.textAlign = 'center';
          context.fillText(spark.glyph ?? '0', spark.x, spark.y);
          break;
        case 'flame':
          this.drawFlame(context, spark.x, spark.y, size);
          break;
        default:
          context.beginPath();
          context.arc(spark.x, spark.y, size, 0, Math.PI * 2);
          context.fill();
      }
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.shadowBlur = 0;
    this.frame = this.window.requestAnimationFrame(this.animate);
  };

  private drawDiamond(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    context.beginPath();
    context.moveTo(x, y - size * 2);
    context.lineTo(x + size * .65, y);
    context.lineTo(x, y + size * 2);
    context.lineTo(x - size * .65, y);
    context.closePath();
    context.fill();
  }

  private drawFlame(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    context.beginPath();
    context.moveTo(x, y - size * 2.4);
    context.bezierCurveTo(
      x + size * 1.4,
      y - size * .7,
      x + size,
      y + size * 1.2,
      x,
      y + size * 1.45,
    );
    context.bezierCurveTo(
      x - size,
      y + size * 1.2,
      x - size * 1.1,
      y - size * .55,
      x,
      y - size * 2.4,
    );
    context.closePath();
    context.fill();
  }

  private readonly resize = (): void => {
    if (!this.window || !this.context) return;
    const canvas = this.trail().nativeElement;
    const scale = Math.min(this.window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(this.window.innerWidth * scale);
    canvas.height = Math.round(this.window.innerHeight * scale);
    canvas.style.width = `${this.window.innerWidth}px`;
    canvas.style.height = `${this.window.innerHeight}px`;
  };

  private clearCanvas(): void {
    if (!this.context) return;
    const canvas = this.trail().nativeElement;
    this.context.clearRect(0, 0, canvas.width, canvas.height);
  }

  private stopAnimation(): void {
    if (!this.window || !this.frame) return;
    this.window.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private destroy(): void {
    if (!this.window) return;
    this.stopAnimation();
    this.window.removeEventListener('pointermove', this.onPointerMove);
    this.window.removeEventListener('pointerdown', this.onPointerDown);
    this.window.removeEventListener('pointerup', this.onPointerUp);
    this.window.removeEventListener('pointercancel', this.onPointerUp);
    this.window.removeEventListener('pointerout', this.onPointerOut);
    this.window.removeEventListener('resize', this.resize);
    this.finePointer?.removeEventListener('change', this.refresh);
    this.reducedMotion?.removeEventListener('change', this.refresh);
  }
}
