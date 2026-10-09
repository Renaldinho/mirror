import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * Shared note persisted by the small .NET/SQLite backend. A browser cache keeps
 * the widget populated while the backend is temporarily unavailable.
 *
 * The backend only stores a single string, so the richer document (free text
 * plus a checklist) is serialised to JSON inside that field. Legacy plain-text
 * notes still load — anything that isn't our JSON shape is treated as text.
 */
const REST_URL = '/api/notes';
const CACHE_KEY = 'dash.notes';

interface NoteDto {
  text: string;
  updatedAt: string;
}

export type NoteMode = 'text' | 'list';

export interface NoteItem {
  id: string;
  text: string;
  done: boolean;
}

interface NoteDoc {
  v: 1;
  mode: NoteMode;
  text: string;
  items: NoteItem[];
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  readonly mode = signal<NoteMode>('text');
  readonly text = signal('');
  readonly items = signal<NoteItem[]>([]);

  private readonly destroyRef = inject(DestroyRef);
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.apply(parseDoc(localStorage.getItem(CACHE_KEY)));
    void this.load();
    this.destroyRef.onDestroy(() => clearTimeout(this.saveTimer));
  }

  /** Switch between the free-text pad and the checklist. */
  setMode(mode: NoteMode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    this.schedule();
  }

  /** Reflect a free-text edit immediately, cache it, then debounce the write. */
  edit(value: string): void {
    this.text.set(value);
    this.schedule();
  }

  addItem(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.items.update((list) => [...list, { id: newId(), text: trimmed, done: false }]);
    this.schedule();
  }

  toggleItem(id: string): void {
    this.items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
    this.schedule();
  }

  editItem(id: string, text: string): void {
    this.items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, text } : item)),
    );
    this.schedule();
  }

  removeItem(id: string): void {
    this.items.update((list) => list.filter((item) => item.id !== id));
    this.schedule();
  }

  /** Move a checklist item from one position to another (drag reorder). */
  reorder(from: number, to: number): void {
    this.items.update((list) => {
      if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    this.schedule();
  }

  private current(): NoteDoc {
    return { v: 1, mode: this.mode(), text: this.text(), items: this.items() };
  }

  /** Push the current document into the signals and the browser cache. */
  private apply(doc: NoteDoc): void {
    this.mode.set(doc.mode);
    this.text.set(doc.text);
    this.items.set(doc.items);
    localStorage.setItem(CACHE_KEY, JSON.stringify(doc));
  }

  /** Cache immediately, then debounce the SQLite write. */
  private schedule(): void {
    const serialized = JSON.stringify(this.current());
    localStorage.setItem(CACHE_KEY, serialized);
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(serialized), 400);
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch(REST_URL);
      if (!response.ok) return;
      const note = await response.json() as NoteDto;
      this.apply(parseDoc(note.text));
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

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Parse a stored field into a document, tolerating legacy plain text and junk. */
function parseDoc(raw: string | null): NoteDoc {
  const empty: NoteDoc = { v: 1, mode: 'text', text: '', items: [] };
  if (!raw) return empty;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isNoteDoc(parsed)) {
      return {
        v: 1,
        mode: parsed.mode === 'list' ? 'list' : 'text',
        text: typeof parsed.text === 'string' ? parsed.text : '',
        items: parsed.items
          .filter(isNoteItem)
          .map((item) => ({ id: item.id, text: item.text, done: item.done === true })),
      };
    }
  } catch {
    // Not JSON — fall through and treat it as plain text.
  }

  return { ...empty, text: raw };
}

function isNoteDoc(value: unknown): value is NoteDoc {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as NoteDoc).v === 1 &&
    Array.isArray((value as NoteDoc).items)
  );
}

function isNoteItem(value: unknown): value is NoteItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as NoteItem).id === 'string' &&
    typeof (value as NoteItem).text === 'string'
  );
}
