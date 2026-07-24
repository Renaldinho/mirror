import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiService } from '../core/ui.service';
import { WsService } from '../core/ws.service';

/**
 * Bottom-right chat: a small round launcher bubble that expands into a compact
 * panel. The message log + composer are unchanged from the old pane; only the
 * shell and animation are new.
 */
@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dock">
      <div class="panel" [class.open]="ui.chatOpen()">
        <div class="panel-head">
          <span class="dot" [attr.data-status]="ws.status()"></span>
          <strong>Peter</strong>
          <span class="sub">{{ ws.status() }}</span>
          <button class="min" (click)="ui.toggleChat()" aria-label="Minimize">–</button>
        </div>
        <div class="log">
          @if (ws.messages().length === 0) {
            <p class="hint">Say something to Peter...</p>
          }
          @for (m of ws.messages(); track $index) {
            <div class="bubble" [class.user]="m.role === 'user'" [class.peter]="m.role === 'assistant'">
              <span class="txt">{{ m.text }}@if (m.streaming) {<span class="caret">▍</span>}</span>
            </div>
          }
        </div>
        <form class="composer" (ngSubmit)="onSend()">
          <input
            [(ngModel)]="draft"
            name="draft"
            placeholder="Talk to Peter..."
            autocomplete="off"
          />
          <button type="submit" [disabled]="!ws.connected()">➤</button>
        </form>
      </div>

      <button class="launcher" [class.hidden]="ui.chatOpen()" (click)="ui.toggleChat()" aria-label="Open chat">
        💬
        @if (!ws.connected()) { <span class="off-dot"></span> }
      </button>
    </div>
  `,
  styles: [
    `
      .dock { position: absolute; right: 20px; bottom: 20px; z-index: 30; }

      .launcher {
        width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
        font-size: 26px; color: #fff; background: linear-gradient(135deg, #4a80ff, #7a5cff);
        box-shadow: 0 8px 24px rgba(74, 128, 255, 0.5);
        transition: transform 0.25s ease, opacity 0.25s ease; position: relative;
      }
      .launcher:hover { transform: scale(1.08); }
      .launcher.hidden { opacity: 0; transform: scale(0.4); pointer-events: none; }
      .off-dot { position: absolute; top: 6px; right: 6px; width: 12px; height: 12px; border-radius: 50%; background: #e74c3c; border: 2px solid #fff; }

      .panel {
        position: absolute; right: 0; bottom: 0;
        width: min(340px, 82vw); height: min(460px, 70vh);
        display: flex; flex-direction: column;
        background: rgba(20, 22, 34, 0.82); backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45); overflow: hidden; color: #eef;
        transform-origin: bottom right; transform: scale(0.2) translateY(20px);
        opacity: 0; pointer-events: none;
        transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.2s ease;
      }
      .panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }

      .panel-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .panel-head strong { font-size: 14px; }
      .panel-head .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; }
      .panel-head .min { margin-left: auto; border: none; background: transparent; color: #cdd; font-size: 22px; line-height: 1; cursor: pointer; padding: 0 4px; }
      .dot { width: 9px; height: 9px; border-radius: 50%; background: #7a8; }
      .dot[data-status='offline'] { background: #e74c3c; }
      .dot[data-status='idle'] { background: #2ecc71; }
      .dot[data-status='thinking'] { background: #f1c40f; }
      .dot[data-status='talking'] { background: #4a80ff; }

      .log { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 12px; }
      .hint { color: #99a; font-size: 13px; }
      .bubble { max-width: 82%; padding: 7px 11px; border-radius: 12px; font-size: 13px; line-height: 1.4; }
      .bubble.user { align-self: flex-end; background: #4a80ff; color: #fff; }
      .bubble.peter { align-self: flex-start; background: rgba(255,255,255,0.1); color: #eef; }
      .caret { animation: blink 1s steps(1) infinite; }
      @keyframes blink { 50% { opacity: 0; } }

      .composer { display: flex; gap: 8px; padding: 10px; border-top: 1px solid rgba(255,255,255,0.1); }
      .composer input { flex: 1; padding: 9px 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; font-size: 13px; background: rgba(0,0,0,0.25); color: #fff; outline: none; }
      .composer input::placeholder { color: #889; }
      .composer button { width: 38px; border: none; border-radius: 50%; background: #4a80ff; color: #fff; cursor: pointer; font-size: 14px; }
      .composer button:disabled { background: #556; cursor: not-allowed; }
    `,
  ],
})
export class Chat {
  readonly ws = inject(WsService);
  readonly ui = inject(UiService);
  readonly draft = signal('');

  onSend(): void {
    this.ws.send(this.draft());
    this.draft.set('');
  }
}
