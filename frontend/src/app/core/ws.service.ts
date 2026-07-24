import { Injectable, computed, signal } from '@angular/core';

// Domain types come from the backend Pydantic schema via `npm run gen:types`.
import { ChatMessage, Notification } from '../generated/model';
import { WS_URL } from './config';

/** A chat bubble in the UI. `streaming` marks the assistant reply currently arriving. */
export interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
  streaming: boolean;
}

/**
 * What Peter is doing right now, driven purely off the WS event stream. The whole
 * "mirror" UI (face, background, status dot) reads this.
 *   offline  – socket closed / backend unreachable
 *   thinking – our message is sent, no assistant.delta back yet
 *   talking  – assistant.delta chunks are streaming in
 *   idle     – connected, nothing in flight ("online")
 */
export type PeterStatus = 'offline' | 'idle' | 'thinking' | 'talking';

// The event envelope on the wire. The payloads (ChatMessage, Notification) are the
// generated shared types; only the thin discriminated wrapper is declared locally.
type Incoming =
  | { type: 'assistant.delta'; text: string }
  | { type: 'assistant.done'; message: ChatMessage }
  | { type: 'notification'; notification: Notification }
  | { type: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class WsService {
  readonly messages = signal<ChatEntry[]>([]);
  readonly notifications = signal<Notification[]>([]);
  readonly connected = signal(false);

  /** In-flight activity while connected; `status` folds `connected` in on top. */
  private readonly activity = signal<'idle' | 'thinking' | 'talking'>('idle');
  readonly status = computed<PeterStatus>(() =>
    this.connected() ? this.activity() : 'offline',
  );

  private ws?: WebSocket;

  connect(): void {
    this.ws = new WebSocket(WS_URL);
    this.ws.onopen = () => this.connected.set(true);
    this.ws.onmessage = (e) => this.handle(JSON.parse(e.data) as Incoming);
    this.ws.onclose = () => {
      this.connected.set(false);
      setTimeout(() => this.connect(), 1500); // auto-reconnect for the always-on Pi
    };
    this.ws.onerror = () => this.ws?.close();
  }

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.ws?.readyState !== WebSocket.OPEN) return;
    this.messages.update((m) => [...m, { role: 'user', text: trimmed, streaming: false }]);
    this.activity.set('thinking');
    this.ws.send(JSON.stringify({ type: 'user.message', text: trimmed }));
  }

  dismiss(id: string | undefined): void {
    if (!id) return;
    this.notifications.update((n) => n.filter((x) => x.id !== id));
  }

  private handle(ev: Incoming): void {
    switch (ev.type) {
      case 'assistant.delta':
        this.appendDelta(ev.text);
        break;
      case 'assistant.done':
        this.finalize(ev.message);
        break;
      case 'notification':
        this.notifications.update((n) => [ev.notification, ...n]);
        break;
      case 'error':
        this.notifications.update((n) => [
          { title: 'Uh oh', body: ev.message, severity: 'warn', kind: 'system' } as Notification,
          ...n,
        ]);
        break;
    }
  }

  private appendDelta(text: string): void {
    this.activity.set('talking');
    this.messages.update((list) => {
      const last = list[list.length - 1];
      if (last && last.role === 'assistant' && last.streaming) {
        const copy = [...list];
        copy[copy.length - 1] = { ...last, text: last.text + text };
        return copy;
      }
      return [...list, { role: 'assistant', text, streaming: true }];
    });
  }

  private finalize(message: ChatMessage): void {
    this.activity.set('idle');
    this.messages.update((list) => {
      const copy = [...list];
      const last = copy[copy.length - 1];
      if (last && last.role === 'assistant' && last.streaming) {
        copy[copy.length - 1] = { role: 'assistant', text: message.text, streaming: false };
      }
      return copy;
    });
  }
}
