import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WsService } from '../core/ws.service';

/**
 * Floating toasts stacked at the top-right, overlaying the mirror. Same data and
 * severity classes as before (info / warn / chaos); only the position and entry
 * animation changed from the old sidebar tray.
 */
@Component({
  selector: 'app-notification-tray',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts">
      @for (n of ws.notifications(); track n.id) {
        <div class="note" [class.warn]="n.severity === 'warn'" [class.chaos]="n.severity === 'chaos'">
          <div class="note-head">
            <span class="sev">{{ n.severity }}</span>
            <strong>{{ n.title }}</strong>
            <button class="x" (click)="ws.dismiss(n.id)" aria-label="Dismiss">×</button>
          </div>
          <div class="body">{{ n.body }}</div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toasts {
        position: absolute; top: 58px; right: 16px; z-index: 25;
        display: flex; flex-direction: column; gap: 8px;
        width: min(300px, 80vw); pointer-events: none;
      }
      .note {
        pointer-events: auto;
        background: rgba(238, 244, 255, 0.96); backdrop-filter: blur(6px);
        border-left: 4px solid #4a80ff; border-radius: 8px; padding: 8px 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
        animation: slidein 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2);
      }
      .note.warn { background: rgba(255, 246, 230, 0.96); border-left-color: #ffab2e; }
      .note.chaos { background: rgba(255, 233, 242, 0.96); border-left-color: #ff2e88; }
      .note-head { display: flex; align-items: center; gap: 8px; }
      .note-head strong { font-size: 13px; color: #222; }
      .sev { font-size: 10px; text-transform: uppercase; background: rgba(0, 0, 0, 0.08); padding: 1px 6px; border-radius: 10px; color: #333; }
      .x { margin-left: auto; border: none; background: transparent; font-size: 18px; cursor: pointer; color: #666; line-height: 1; }
      .body { font-size: 13px; color: #333; margin-top: 4px; }

      @keyframes slidein { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    `,
  ],
})
export class NotificationTray {
  readonly ws = inject(WsService);
}
