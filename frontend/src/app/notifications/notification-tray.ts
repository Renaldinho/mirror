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
        background: var(--theme-panel-opaque); color: var(--theme-text); backdrop-filter: blur(10px);
        border: 1px solid var(--theme-border); border-left: 4px solid var(--theme-info);
        border-radius: var(--control-radius); padding: 8px 10px;
        box-shadow: var(--theme-shadow-soft);
        animation: slidein 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2);
      }
      .note.warn { background: var(--theme-panel-opaque); border-left-color: var(--theme-warning); }
      .note.chaos { background: var(--theme-panel-opaque); border-left-color: var(--theme-chaos); }
      .note-head { display: flex; align-items: center; gap: 8px; }
      .note-head strong { font-size: 13px; color: var(--theme-text); }
      .sev { font-size: 10px; text-transform: uppercase; background: var(--theme-surface-hover); padding: 1px 6px; border-radius: var(--control-radius); color: var(--theme-text-muted); }
      .x { margin-left: auto; border: none; background: transparent; font-size: 18px; cursor: pointer; color: var(--theme-text-muted); line-height: 1; }
      .body { font-size: 13px; color: var(--theme-text-muted); margin-top: 4px; }

      @keyframes slidein { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    `,
  ],
})
export class NotificationTray {
  readonly ws = inject(WsService);
}
