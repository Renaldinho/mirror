import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiService } from '../core/ui.service';
import { WsService } from '../core/ws.service';
import { PeterFace } from '../face/peter-face';

/**
 * Bottom-right chat: a round launcher bubble showing Peter's face that expands
 * into a compact panel. Peter's face lives here (both as the collapsed avatar and
 * as a banner atop the open panel) — the fullscreen stage stays a bare mirror.
 */
@Component({
  selector: 'app-chat',
  imports: [FormsModule, PeterFace],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dock">
      <div class="panel" [class.open]="ui.chatOpen()">
        <div class="panel-head">
          <div class="banner"><app-peter-face /></div>
          <div class="head-meta">
            <span class="dot" [attr.data-status]="ws.status()"></span>
            <strong>Peter</strong>
            <span class="sub">{{ ws.status() }}</span>
          </div>
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
        <app-peter-face />
        @if (!ws.connected()) { <span class="off-dot"></span> }
      </button>
    </div>
  `,
  styles: [
    `
      .dock { position: absolute; right: 20px; bottom: 20px; z-index: 30; }

      .launcher {
        width: 66px; height: 66px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.25);
        cursor: pointer; padding: 0; overflow: hidden; background: #1a1d2e;
        box-shadow: 0 8px 24px rgba(74, 128, 255, 0.45);
        transition: transform 0.25s ease, opacity 0.25s ease; position: relative;
      }
      .launcher:hover { transform: scale(1.08); }
      .launcher.hidden { opacity: 0; transform: scale(0.4); pointer-events: none; }
      .launcher app-peter-face { display: block; width: 100%; height: 100%; }
      .off-dot { position: absolute; top: 4px; right: 4px; width: 13px; height: 13px; border-radius: 50%; background: #e74c3c; border: 2px solid #1a1d2e; }

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

      .panel-head { position: relative; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .banner { width: 100%; height: 150px; }
      .head-meta {
        position: absolute; left: 0; right: 0; bottom: 0;
        display: flex; align-items: center; gap: 8px; padding: 8px 12px;
        background: linear-gradient(to top, rgba(20,22,34,0.92), rgba(20,22,34,0));
      }
      .head-meta strong { font-size: 14px; }
      .head-meta .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
      .panel-head .min {
        position: absolute; top: 6px; right: 8px; border: none;
        background: rgba(0,0,0,0.35); color: #fff; width: 26px; height: 26px; border-radius: 50%;
        font-size: 20px; line-height: 1; cursor: pointer;
      }
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
