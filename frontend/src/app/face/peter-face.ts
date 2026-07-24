import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { WsService } from '../core/ws.service';
import { FACE_LABEL, FACE_SRC } from './faces';

/**
 * The mirror centerpiece: Peter's face, swapped by `ws.status()`. If the artwork
 * for a state is missing, we fall back to a labeled placeholder circle so the app
 * still runs before any assets have been dropped into `public/peter/`.
 */
@Component({
  selector: 'app-peter-face',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stage" [attr.data-status]="status()">
      @if (broken()) {
        <div class="placeholder">
          <div class="ring"></div>
          <span class="face-emoji">🙂</span>
          <span class="label">Peter · {{ label() }}</span>
        </div>
      } @else {
        <img
          class="face"
          [src]="src()"
          alt="Peter Griffin"
          (error)="broken.set(true)"
        />
      }
    </div>
  `,
  styles: [
    `
      .stage {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .face {
        max-width: min(70vmin, 620px);
        max-height: 80vh;
        object-fit: contain;
        filter: drop-shadow(0 12px 40px rgba(0, 0, 0, 0.35));
        transition: filter 0.4s ease, opacity 0.4s ease;
        animation: breathe 5s ease-in-out infinite;
      }
      /* idle = gentle breathing (default). talking = livelier bob on top of the gif. */
      .stage[data-status='talking'] .face { animation: bob 0.6s ease-in-out infinite; }
      .stage[data-status='thinking'] .face { animation: sway 2.4s ease-in-out infinite; }
      .stage[data-status='offline'] .face {
        filter: grayscale(1) brightness(0.6);
        opacity: 0.55;
        animation: none;
      }

      @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
      @keyframes bob { 0%, 100% { transform: translateY(0) scale(1.01); } 50% { transform: translateY(-10px) scale(1.03); } }
      @keyframes sway { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }

      @media (prefers-reduced-motion: reduce) {
        .face { animation: none !important; }
      }

      /* Fallback shown until real artwork exists. */
      .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        color: #cbd5e1;
      }
      .ring {
        position: absolute;
        width: min(52vmin, 420px);
        height: min(52vmin, 420px);
        border-radius: 50%;
        border: 2px dashed rgba(148, 163, 184, 0.4);
        animation: breathe 5s ease-in-out infinite;
      }
      .face-emoji { font-size: min(28vmin, 220px); line-height: 1; }
      .label { font-size: 14px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7; }
      .stage[data-status='offline'] .placeholder { opacity: 0.5; }
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
