import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef,
  NgZone, effect, inject, viewChild,
} from '@angular/core';
import { GamesService } from '../minigames/games.service';

const CELL_WIDTH = 16;
const CELL_HEIGHT = 20;
const GLYPHS = '01234567890101ABCDEF<>[]{}+-*/=:'.split('');
const MESSAGES = [
  'WAKE UP. THE COFFEE IS GETTING COLD.',
  'THERE IS NO SPOON. TRY A FORK.',
  'FOLLOW THE WHITE RABBIT. BRING SNACKS.',
  'REALITY.EXE: RUNNING ON VIBES.',
  'DOWNLOADING COMMON SENSE... 1%',
  'NPC MODE: DISABLED.',
];

/** Cached character sprites and a 640px canvas keep the always-on effect inexpensive. */
@Component({
  selector: 'app-digital-rain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<canvas #canvas aria-hidden="true"></canvas><div class="vignette"></div>',
  styles: [`
    :host { position: absolute; inset: 0; pointer-events: none; }
    canvas { display: block; width: 100%; height: 100%; opacity: .62; }
    .vignette { position: absolute; inset: 0; background: radial-gradient(ellipse, transparent 30%, rgba(0,0,0,.76) 100%); }
  `],
})
export class DigitalRain implements AfterViewInit {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly games = inject(GamesService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  private context: CanvasRenderingContext2D | null = null;
  private atlas: HTMLCanvasElement | null = null;
  private messages: HTMLCanvasElement | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private streams: { speed: number; offset: number; depth: number; length: number; digits: number[] }[] = [];

  constructor() {
    effect(() => {
      this.games.playing();
      if (this.context && this.atlas && this.messages) this.refresh();
    });
  }

  ngAfterViewInit(): void {
    this.context = this.canvasRef().nativeElement.getContext('2d');
    if (!this.context) return;
    this.atlas = document.createElement('canvas');
    this.atlas.width = CELL_WIDTH * GLYPHS.length;
    this.atlas.height = CELL_HEIGHT * 2;
    const glyphs = this.atlas.getContext('2d');
    if (!glyphs) return;
    glyphs.font = 'bold 13px monospace';
    glyphs.textBaseline = 'top';
    // Glow is baked into the small atlas once, rather than filtered every frame.
    glyphs.shadowBlur = 2;
    glyphs.shadowColor = '#38ff82';
    for (let row = 0; row < 2; row++) {
      glyphs.fillStyle = row === 0 ? '#25d970' : '#dbffe7';
      GLYPHS.forEach((glyph, index) => glyphs.fillText(glyph, index * CELL_WIDTH + 3, row * CELL_HEIGHT + 2));
    }
    this.messages = document.createElement('canvas');
    this.messages.width = 640;
    this.messages.height = CELL_HEIGHT * MESSAGES.length;
    const messages = this.messages.getContext('2d');
    if (!messages) return;
    messages.font = 'bold 12px monospace';
    messages.textBaseline = 'top';
    messages.fillStyle = '#a0ffc1';
    MESSAGES.forEach((message, index) => messages.fillText('> ' + message, 0, index * CELL_HEIGHT));
    this.zone.runOutsideAngular(() => {
      this.resize();
      window.addEventListener('resize', this.resize);
      document.addEventListener('visibilitychange', this.refresh);
      this.reducedMotion?.addEventListener('change', this.refresh);
      this.refresh();
    });
    this.destroyRef.onDestroy(() => {
      this.stop();
      window.removeEventListener('resize', this.resize);
      document.removeEventListener('visibilitychange', this.refresh);
      this.reducedMotion?.removeEventListener('change', this.refresh);
    });
  }

  private readonly resize = (): void => {
    const canvas = this.canvasRef().nativeElement;
    const scale = Math.min(1, 640 / Math.max(window.innerWidth, window.innerHeight));
    canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
    this.streams = Array.from({ length: Math.ceil(canvas.width / CELL_WIDTH) }, () => {
      const depth = .35 + Math.random() * .65;
      return {
        depth, speed: (32 + Math.random() * 44) * depth,
        offset: Math.random() * canvas.height, length: 8 + Math.floor(Math.random() * 16),
        digits: Array.from({ length: 64 }, () => Math.floor(Math.random() * GLYPHS.length)),
      };
    });
    this.context!.imageSmoothingEnabled = false;
    this.draw();
  };

  private readonly refresh = (): void => {
    this.stop();
    if (document.hidden || this.games.playing() || this.reducedMotion?.matches) return;
    this.zone.runOutsideAngular(() => { this.timer = setInterval(this.draw, 1000 / 12); });
  };

  private stop(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }

  private readonly draw = (): void => {
    const canvas = this.canvasRef().nativeElement;
    const context = this.context!;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const time = performance.now() / 1000;
    for (let column = 0; column < this.streams.length; column++) {
      const stream = this.streams[column];
      const step = Math.floor((time * stream.speed + stream.offset) / CELL_HEIGHT);
      const rows = Math.ceil(canvas.height / CELL_HEIGHT) + stream.length + 8;
      const head = step % rows;
      const size = .7 + stream.depth * .3;
      for (let tail = 0; tail < stream.length; tail++) {
        const y = (head - tail) * CELL_HEIGHT;
        if (y < 0 || y >= canvas.height) continue;
        const index = ((step - tail) % stream.digits.length + stream.digits.length) % stream.digits.length;
        context.globalAlpha = stream.depth * (1 - tail / stream.length) ** 1.5;
        context.drawImage(this.atlas!, stream.digits[index] * CELL_WIDTH, tail === 0 ? CELL_HEIGHT : 0,
          CELL_WIDTH, CELL_HEIGHT, column * CELL_WIDTH, y, CELL_WIDTH * size, CELL_HEIGHT * size);
      }
    }
    // Brief background-only transmissions leave the dashboard readable between jokes.
    const phase = time % 28;
    if (phase > 2 && phase < 8) {
      const message = Math.floor(time / 28) % MESSAGES.length;
      context.globalAlpha = Math.min(1, phase - 2, 8 - phase) * .8;
      const width = Math.min(640, canvas.width * .9);
      context.drawImage(this.messages!, 0, message * CELL_HEIGHT, 640, CELL_HEIGHT,
        canvas.width * .05, canvas.height * .38, width, CELL_HEIGHT * width / 640);
    }
    context.globalAlpha = 1;
  };
}
