import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * Shared note persisted by the small .NET/SQLite backend. A browser cache keeps
 * the widget populated while the backend is temporarily unavailable.
 */
const REST_URL = '/api/notes';
const CACHE_KEY = 'dash.notes';

interface NoteDto {
  text: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  readonly text = signal(localStorage.getItem(CACHE_KEY) ?? '');

  private readonly destroyRef = inject(DestroyRef);
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    void this.load();
    this.destroyRef.onDestroy(() => clearTimeout(this.saveTimer));
  }

  /** Reflect an edit immediately, cache it, then debounce the SQLite write. */
  edit(value: string): void {
    this.apply(value);
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(value), 400);
  }

  private apply(value: string): void {
    this.text.set(value);
    localStorage.setItem(CACHE_KEY, value);
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch(REST_URL);
      if (!response.ok) return;
      const note = await response.json() as NoteDto;
      this.apply(note.text);
    } catch {
      // Keep the cached value.
    }
  }

  private async save(value: string): Promise<void> {
    try {
      await fetch(REST_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
    } catch {
      // Keep the cached edit; it can be saved by the next edit/reload.
    }
  }
}
