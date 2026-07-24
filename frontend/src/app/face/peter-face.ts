import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { WsService } from '../core/ws.service';
import { FACE_LABEL, FACE_SRC } from './faces';

/**
 * Peter's face as a container-filling avatar. It fills whatever box the parent
 * gives it (`object-fit: cover`), so every state renders at the same on-screen
 * size regardless of the source image's dimensions — no more size jumping.
 * If a state's artwork is missing, a labeled placeholder is shown instead so the
 * app still runs before assets exist.
 */
@Component({
  selector: 'app-peter-face',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="face-box" [attr.data-status]="status()">
      @if (broken()) {
        <div class="placeholder">
          <span class="face-emoji">🙂</span>
          <span class="label">{{ label() }}</span>
        </div>
      } @else {
        <img class="face" [src]="src()" alt="Peter Griffin" (error)="broken.set(true)" />
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; height: 100%; }
      .face-box { width: 100%; height: 100%; position: relative; overflow: hidden; }
      .face {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: filter 0.4s ease, opacity 0.4s ease;
        animation: breathe 5s ease-in-out infinite;
      }
      .face-box[data-status='talking'] .face { animation: bob 0.7s ease-in-out infinite; }
      .face-box[data-status='thinking'] .face { animation: sway 2.4s ease-in-out infinite; }
      .face-box[data-status='offline'] .face { filter: grayscale(1) brightness(0.6); opacity: 0.6; animation: none; }

      @keyframes breathe { 0%, 100% { transform: scale(1.02); } 50% { transform: scale(1.06); } }
      @keyframes bob { 0%, 100% { transform: scale(1.03) translateY(0); } 50% { transform: scale(1.05) translateY(-3px); } }
      @keyframes sway { 0%, 100% { transform: scale(1.02) rotate(-1deg); } 50% { transform: scale(1.02) rotate(1deg); } }
      @media (prefers-reduced-motion: reduce) { .face { animation: none !important; } }

      .placeholder {
        width: 100%; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 4px; background: rgba(255, 255, 255, 0.06); color: #cbd5e1;
      }
      .face-emoji { font-size: 2.2rem; line-height: 1; }
      .label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.7; }
    `,
  ],
})
export class PeterFace {
  readonly ws = inject(WsService);

  readonly status = this.ws.status;
  readonly src = computed(() => FACE_SRC[this.status()]);
  readonly label = computed(() => FACE_LABEL[this.status()]);
  readonly broken = signal(false);

  constructor() {
    // A new state means a new asset URL — give it a fresh chance to load even if
    // a previous state's file was missing.
    effect(() => {
      this.src();
      this.broken.set(false);
    });
  }
}
