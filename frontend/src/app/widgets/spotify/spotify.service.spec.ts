import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SpotifyService } from './spotify.service';

const playback = {
  is_playing: true, progress_ms: 1000, device: { name: 'Phone', volume_percent: 50 },
  item: { id: 'song', name: 'Test song', duration_ms: 180_000, artists: [{ name: 'Artist' }], album: { name: 'Album' } },
};
const response = (body: unknown, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), { status });

function restoreSession(): SpotifyService {
  const service = TestBed.inject(SpotifyService);
  // The test runner does not load the browser's public config.js. Start the
  // saved-session polling path directly, with all network calls mocked.
  service.configured.set(true);
  service.authed.set(true);
  (service as unknown as { startPolling(): void }).startPolling();
  return service;
}

describe('Spotify session recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('spotify.tokens', JSON.stringify({
      access: 'old-access', refresh: 'saved-refresh', expiresAt: Date.now() + 3600_000,
    }));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('refreshes and retries a rejected access token without requiring another sign-in', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(null, 401))
      .mockResolvedValueOnce(response({ access_token: 'new-access', expires_in: 3600 }))
      .mockResolvedValueOnce(response(playback));
    vi.stubGlobal('fetch', fetch);
    const service = restoreSession();
    await vi.waitFor(() => expect(service.track()?.title).toBe('Test song'));
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access');
    expect(JSON.parse(localStorage.getItem('spotify.tokens')!).refresh).toBe('saved-refresh');
    expect(service.authed()).toBe(true);
    expect(service.error()).toBeNull();
  });

  it('preserves the saved session during a failed refresh and recovers on the next poll', async () => {
    const saved = JSON.stringify({ access: 'old-access', refresh: 'saved-refresh', expiresAt: Date.now() - 1 });
    localStorage.setItem('spotify.tokens', saved);
    const fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response({ access_token: 'new-access', expires_in: 3600 }))
      .mockResolvedValueOnce(response(playback));
    vi.stubGlobal('fetch', fetch);
    const service = restoreSession();
    await vi.waitFor(() => expect(service.error()).toContain('Cannot reach Spotify'));
    expect(service.authed()).toBe(true);
    expect(localStorage.getItem('spotify.tokens')).toBe(saved);
    await vi.advanceTimersByTimeAsync(6000);
    expect(service.track()?.title).toBe('Test song');
    expect(service.error()).toBeNull();
  });

  it('only clears the session when Spotify rejects its refresh credentials', async () => {
    localStorage.setItem('spotify.tokens', JSON.stringify({
      access: 'old-access', refresh: 'saved-refresh', expiresAt: Date.now() - 1,
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: 'invalid_grant' }, 400)));
    const service = restoreSession();
    await vi.waitFor(() => expect(service.error()).toContain('Connect again'));
    expect(service.authed()).toBe(false);
    expect(localStorage.getItem('spotify.tokens')).toBeNull();
  });

  it('shows denied playback access instead of silently reporting nothing playing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(null, 403)));
    const service = restoreSession();
    await vi.waitFor(() => expect(service.error()).toContain('denied playback access'));
    expect(service.authed()).toBe(true);
    expect(localStorage.getItem('spotify.tokens')).not.toBeNull();
  });

  it('clears stale playback when Spotify reports no active player', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(playback))
      .mockResolvedValue(response(null, 204)));
    const service = restoreSession();
    await vi.waitFor(() => expect(service.track()).not.toBeNull());
    await vi.advanceTimersByTimeAsync(3000);
    expect(service.track()).toBeNull();
    expect(service.hasDevice()).toBe(false);
    expect(service.paused()).toBe(true);
    expect(service.error()).toBeNull();
    expect(service.authed()).toBe(true);
  });
});
