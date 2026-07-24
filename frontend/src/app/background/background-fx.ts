import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { UiService } from '../core/ui.service';
import { PeterStatus, WsService } from '../core/ws.service';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
}

/** How lively the field is per state: [speed multiplier, brightness 0..1]. */
const MOOD: Record<PeterStatus, [number, number]> = {
  talking: [2.2, 1],
  thinking: [1.3, 0.8],
  idle: [0.6, 0.55],
  offline: [0.05, 0.2],
};

/** Keep it cheap for the Raspberry Pi 4 kiosk. */
const MAX_ORBS = 40;

@Component({
  selector: 'app-background-fx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas class="fx"></canvas>`,
  styles: [
    `
      .fx {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class BackgroundFx implements AfterViewInit {
  private readonly ws = inject(WsService);
  private readonly ui = inject(UiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx?: CanvasRenderingContext2D;
  private orbs: Orb[] = [];
  private raf = 0;
  private reduced = false;

  constructor() {
    // Start/stop the RAF loop whenever the background is toggled. When off we stop
    // the loop entirely (no CPU spin) and clear the canvas.
    effect(() => {
      const on = this.ui.bgEnabled();
      if (!this.ctx) return;
      if (on) this.start();
      else this.stop();
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext('2d') ?? undefined;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.resize();
    const onResize = () => this.resize();
    window.addEventListener('resize', onResize);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      this.stop();
    });

    if (this.ui.bgEnabled()) this.start();
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.orbs.length === 0) this.seed();
  }

  private seed(): void {
    const { innerWidth: w, innerHeight: h } = window;
    this.orbs = Array.from({ length: MAX_ORBS }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 6 + Math.random() * 26,
      hue: 190 + Math.random() * 90, // teal → violet
    }));
  }

  private start(): void {
    if (this.raf) return;
    const loop = () => {
      this.frame();
      // With reduced motion we draw one static frame and stop.
      if (this.reduced) {
        this.raf = 0;
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    const { innerWidth: w, innerHeight: h } = window;
    this.ctx?.clearRect(0, 0, w, h);
  }

  private frame(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { innerWidth: w, innerHeight: h } = window;
    const [speed, brightness] = MOOD[this.ws.status()];

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (const o of this.orbs) {
      if (!this.reduced) {
        o.x += o.vx * speed;
        o.y += o.vy * speed;
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;
      }

      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, `hsla(${o.hue}, 80%, 65%, ${0.28 * brightness})`);
      grad.addColorStop(1, `hsla(${o.hue}, 80%, 65%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }
}
