import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KioskService } from './kiosk.service';

describe('Pi desktop switching', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('requests only a fixed mode and recovers if the browser does not restart', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ available: true, mode: 'kiosk' }) });
    vi.stubGlobal('fetch', fetcher);
    const kiosk = TestBed.inject(KioskService);
    await kiosk.refresh();
    expect(kiosk.available()).toBe(true);
    await kiosk.switchMode('desktop');
    expect(fetcher.mock.calls[1][0]).toBe('/api/kiosk/mode');
    const request = fetcher.mock.calls[1][1];
    expect(JSON.parse(request.body)).toEqual({ mode: 'desktop' });
    expect(request.headers['X-Mirror-Request']).toBe('kiosk-mode');
    expect(kiosk.busy()).toBe(true);
    await vi.advanceTimersByTimeAsync(8000);
    expect(kiosk.busy()).toBe(false);
    expect(kiosk.error()).toContain('did not switch');
  });

  it('handles desktop mode, failed requests, and installations without a helper', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ available: true, mode: 'desktop' }) })
      .mockRejectedValueOnce(new Error('Offline'));
    vi.stubGlobal('fetch', fetcher);
    const kiosk = TestBed.inject(KioskService);
    await kiosk.refresh();
    expect(kiosk.mode()).toBe('desktop');
    await kiosk.switchMode('kiosk');
    expect(kiosk.busy()).toBe(false);
    expect(kiosk.error()).toContain('Could not switch');
    fetcher.mockResolvedValue({ ok: false });
    await kiosk.refresh();
    expect(kiosk.available()).toBe(false);
    const count = fetcher.mock.calls.length;
    await kiosk.switchMode('desktop');
    expect(fetcher).toHaveBeenCalledTimes(count);
  });
});
