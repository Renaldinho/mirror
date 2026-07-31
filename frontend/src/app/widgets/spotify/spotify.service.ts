import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { codeChallenge, randomState, randomVerifier } from './pkce';
import {
  API_BASE,
  AUTH_URL,
  CLIENT_ID,
  REDIRECT_URI,
  SCOPES,
  TOKEN_URL,
} from './spotify.config';

export interface Track {
  id: string;
  title: string;
  artists: string;
  album: string;
  artUrl: string | null;
  durationMs: number;
}

interface Tokens {
  access: string;
  refresh: string;
  expiresAt: number;
}

const TOKENS_KEY = 'spotify.tokens';
const VERIFIER_KEY = 'spotify.verifier';
const STATE_KEY = 'spotify.state';

/**
 * Client-side Spotify remote control (PKCE). The mirror does NOT stream audio —
 * it reads the user's *active* device via the Web API and controls that device
 * (play/pause/skip/seek/volume), the way the desktop app controls the phone.
 * Reading now-playing works on any account; controlling requires Premium.
 */
@Injectable({ providedIn: 'root' })
export class SpotifyService {
  readonly configured = signal(!!CLIENT_ID);
  readonly authed = signal(false);
  readonly premiumError = signal(false);

  readonly track = signal<Track | null>(null);
  readonly positionMs = signal(0);
  readonly paused = signal(true);
  readonly volume = signal(0.5);
  readonly deviceName = signal<string | null>(null);
  readonly hasDevice = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private tokens: Tokens | null = this.loadTokens();
  private pollTimer?: ReturnType<typeof setInterval>;
  private tickTimer?: ReturnType<typeof setInterval>;
  private backoffUntil = 0;
  private lastTick = 0;

  constructor() {
    this.tickTimer = setInterval(() => this.tickPosition(), 250);
    this.destroyRef.onDestroy(() => {
      if (this.tickTimer) clearInterval(this.tickTimer);
      if (this.pollTimer) clearInterval(this.pollTimer);
    });
    // No client ID configured: stay dormant and drop any stale tokens left in this
    // browser profile, so an old/expired token can't spam failed refreshes.
    if (!this.configured()) {
      if (this.tokens) this.disconnect();
      return;
    }

    void this.handleRedirect().then(() => {
      if (this.tokens) {
        this.authed.set(true);
        this.startPolling();
      }
    });
  }

  async login(): Promise<void> {
    if (!CLIENT_ID) return;
    const verifier = randomVerifier();
    const state = randomState();
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state,
      code_challenge_method: 'S256',
      code_challenge: await codeChallenge(verifier),
    });
    window.location.assign(`${AUTH_URL}?${params.toString()}`);
  }

  logout(): void {
    this.disconnect();
  }

  /** Drop tokens and stop polling — on sign-out, or when Spotify rejects the token. */
  private disconnect(): void {
    this.tokens = null;
    localStorage.removeItem(TOKENS_KEY);
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = undefined;
    this.authed.set(false);
    this.track.set(null);
    this.hasDevice.set(false);
    this.deviceName.set(null);
  }

  // ---- transport controls (act on the active device) ----
  async togglePlay(): Promise<void> {
    const willPlay = this.paused();
    this.paused.set(!willPlay);
    await this.api(`/me/player/${willPlay ? 'play' : 'pause'}`, 'PUT');
    this.soonRefresh();
  }
  async next(): Promise<void> {
    await this.api('/me/player/next', 'POST');
    this.soonRefresh();
  }
  async prev(): Promise<void> {
    await this.api('/me/player/previous', 'POST');
    this.soonRefresh();
  }
  async seek(ms: number): Promise<void> {
    this.positionMs.set(ms);
    await this.api(`/me/player/seek?position_ms=${Math.floor(ms)}`, 'PUT');
  }
  setVolume(value: number): void {
    this.volume.set(value);
    void this.api(`/me/player/volume?volume_percent=${Math.round(value * 100)}`, 'PUT');
  }

  // ---- auth ----
  private async handleRedirect(): Promise<void> {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code) return;
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    history.replaceState({}, '', url.toString());

    if (state !== sessionStorage.getItem(STATE_KEY)) return;
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    if (!verifier) return;

    await this.exchange(
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: verifier,
      }),
    );
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
  }

  private async exchange(body: URLSearchParams): Promise<boolean> {
    try {
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) return false;
      const json = (await res.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
      };
      this.tokens = {
        access: json.access_token,
        refresh: json.refresh_token ?? this.tokens?.refresh ?? '',
        expiresAt: Date.now() + json.expires_in * 1000,
      };
      localStorage.setItem(TOKENS_KEY, JSON.stringify(this.tokens));
      return true;
    } catch {
      return false;
    }
  }

  private async token(): Promise<string | null> {
    if (!this.tokens) return null;
    if (this.tokens.expiresAt - Date.now() < 60_000) {
      const refreshed =
        this.tokens.refresh &&
        (await this.exchange(
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.tokens.refresh,
            client_id: CLIENT_ID,
          }),
        ));
      if (!refreshed) {
        // No refresh token, or Spotify rejected it (e.g. issued for a different
        // client): give up instead of polling with a dead token forever.
        this.disconnect();
        return null;
      }
    }
    return this.tokens?.access ?? null;
  }

  // ---- polling the active device ----
  private startPolling(): void {
    if (this.pollTimer) return;
    void this.poll();
    this.pollTimer = setInterval(() => void this.poll(), 3000);
  }

  private soonRefresh(): void {
    setTimeout(() => void this.poll(), 400);
  }

  private async poll(): Promise<void> {
    if (Date.now() < this.backoffUntil) return;
    const token = await this.token();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/me/player`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        this.hasDevice.set(false);
        this.deviceName.set(null);
        this.paused.set(true);
        return;
      }
      if (res.status === 401) {
        this.disconnect();
        return;
      }
      if (res.status === 429) {
        const retry = Number(res.headers.get('Retry-After') ?? '5');
        this.backoffUntil = Date.now() + (retry + 1) * 1000;
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as {
        is_playing: boolean;
        progress_ms: number;
        device?: { name: string; volume_percent: number };
        item?: SpotifyItem;
      };
      this.hasDevice.set(!!json.device);
      this.deviceName.set(json.device?.name ?? null);
      if (typeof json.device?.volume_percent === 'number') {
        this.volume.set(json.device.volume_percent / 100);
      }
      this.paused.set(!json.is_playing);
      this.positionMs.set(json.progress_ms ?? 0);
      this.lastTick = performance.now();
      if (json.item) this.setTrack(json.item);
    } catch {
      /* ignore */
    }
  }

  private setTrack(item: SpotifyItem): void {
    if (this.track()?.id === item.id) return;
    this.track.set({
      id: item.id,
      title: item.name,
      artists: item.artists.map((a) => a.name).join(', '),
      album: item.album?.name ?? '',
      artUrl: item.album?.images?.[0]?.url ?? null,
      durationMs: item.duration_ms,
    });
  }

  private async api(path: string, method: string): Promise<void> {
    const token = await this.token();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) this.disconnect();
      else if (res.status === 403) this.premiumError.set(true);
      else if (res.ok || res.status === 204) this.premiumError.set(false);
    } catch {
      /* ignore */
    }
  }

  private tickPosition(): void {
    if (this.paused() || !this.track()) return;
    const now = performance.now();
    const delta = this.lastTick ? now - this.lastTick : 0;
    this.lastTick = now;
    this.positionMs.update((p) => Math.min(this.track()!.durationMs, p + delta));
  }

  private loadTokens(): Tokens | null {
    try {
      const raw = localStorage.getItem(TOKENS_KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  }
}

interface SpotifyItem {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
}
