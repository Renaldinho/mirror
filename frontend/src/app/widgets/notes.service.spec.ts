import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotesService } from './notes.service';

function mockFetch(storedText: string): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    text: storedText,
    updatedAt: new Date().toISOString(),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
}

describe('NotesService persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads a legacy plain-text note as text mode', async () => {
    mockFetch('Stored note');
    const service = TestBed.inject(NotesService);

    await vi.waitFor(() => expect(service.text()).toBe('Stored note'));
    expect(service.mode()).toBe('text');
    expect(service.items()).toEqual([]);
  });

  it('debounces text edits and persists the serialised document', async () => {
    mockFetch('Stored note');
    const service = TestBed.inject(NotesService);
    await vi.waitFor(() => expect(service.text()).toBe('Stored note'));
    vi.mocked(fetch).mockClear();

    service.edit('One');
    service.edit('One two');
    await vi.advanceTimersByTimeAsync(400);

    const expected = JSON.stringify({ v: 1, mode: 'text', text: 'One two', items: [] });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('/api/notes', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ text: expected }),
    }));
    expect(localStorage.getItem('dash.notes')).toBe(expected);
  });

  it('loads a stored checklist document and round-trips item changes', async () => {
    const doc = {
      v: 1,
      mode: 'list',
      text: '',
      items: [{ id: 'a', text: 'Milk', done: false }],
    };
    mockFetch(JSON.stringify(doc));
    const service = TestBed.inject(NotesService);

    await vi.waitFor(() => expect(service.items().length).toBe(1));
    expect(service.mode()).toBe('list');

    service.toggleItem('a');
    service.addItem('Bread');
    await vi.advanceTimersByTimeAsync(400);

    expect(service.items()).toEqual([
      { id: 'a', text: 'Milk', done: true },
      expect.objectContaining({ text: 'Bread', done: false }),
    ]);
    const saved = JSON.parse(localStorage.getItem('dash.notes')!);
    expect(saved.mode).toBe('list');
    expect(saved.items[0].done).toBe(true);
    expect(saved.items[1].text).toBe('Bread');
  });

  it('reorders checklist items', async () => {
    const doc = {
      v: 1,
      mode: 'list',
      text: '',
      items: [
        { id: 'a', text: 'First', done: false },
        { id: 'b', text: 'Second', done: false },
        { id: 'c', text: 'Third', done: false },
      ],
    };
    mockFetch(JSON.stringify(doc));
    const service = TestBed.inject(NotesService);
    await vi.waitFor(() => expect(service.items().length).toBe(3));

    service.reorder(0, 2);

    expect(service.items().map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });
});
