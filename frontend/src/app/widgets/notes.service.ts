import { Injectable, signal } from '@angular/core';

/**
 * Shared notes store, synced across devices through the .NET backend:
 *   - loads the current note over REST on startup,
 *   - pushes edits with a short debounce (PUT, requires sign-in),
 *   - listens on a WebSocket so a note typed on a phone appears here live.
 *
 * URLs are relative: the backend serves this app in production (same origin on the
 * Pi) and a dev proxy forwards /api and /ws to it. `dash.notes` in localStorage is
 * kept as an offline cache so the widget doesn't blank out if the backend is down.
 */

const REST_URL = '/api/notes';
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const CACHE_KEY = 'dash.notes';

interface NoteDto {
  text: string;
  updatedAt: string;
}
interface NoteEvent {
  type: string;
  text: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  readonly text = signal(localStorage.getItem(CACHE_KEY) ?? '');

  private ws?: WebSocket;
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.load();
    this.connect();
  }

  /** User edit from the textarea: reflect immediately, cache, then debounce a save. */
  edit(value: string): void {
    this.apply(value);
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(value), 400);
  }

  private apply(value: string): void {
    this.text.set(value);
    localStorage.setItem(CACHE_KEY, value);
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch(REST_URL);
      if (!res.ok) return;
      const dto = (await res.json()) as NoteDto;
      this.apply(dto.text);
    } catch {
      // offline: keep the cached value already in the signal
    }
  }

  private async save(value: string): Promise<void> {
    try {
      await fetch(REST_URL, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
    } catch {
      // offline: cache holds the edit; it resends on the next edit/reload
    }
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.onmessage = (e) => {
        const ev = JSON.parse(e.data) as NoteEvent;
        // Ignore our own echo so the caret doesn't jump while typing.
        if (ev.type === 'note.updated' && ev.text !== this.text()) this.apply(ev.text);
      };
      this.ws.onclose = () => setTimeout(() => this.connect(), 1500);
      this.ws.onerror = () => this.ws?.close();
    } catch {
      // will retry on next connect()
    }
  }
}
