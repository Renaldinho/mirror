import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotesService } from './notes.service';

describe('NotesService persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      text: 'Stored note',
      updatedAt: new Date().toISOString(),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads the note and debounces edits to the backend', async () => {
    const service = TestBed.inject(NotesService);
    await vi.waitFor(() => expect(service.text()).toBe('Stored note'));
    vi.mocked(fetch).mockClear();

    service.edit('One');
    service.edit('One two');
    await vi.advanceTimersByTimeAsync(400);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('/api/notes', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ text: 'One two' }),
    }));
    expect(localStorage.getItem('dash.notes')).toBe('One two');
  });
});
