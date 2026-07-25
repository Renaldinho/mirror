import { Injectable, signal } from '@angular/core';
import { codeChallenge, randomState, randomVerifier } from './pkce';
import {
  API_BASE,
  AUTH_URL,
  CLIENT_ID,
  DEVICE_NAME,
  REDIRECT_URI,
  SCOPES,
  SDK_SRC,
  SpotifyPlayer,
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
 * Client-side Spotify (PKCE). Streams on the mirror via the Web Playback SDK when
 * the account is Premium and the origin is secure; otherwise falls back to a
 * read-only poll of the user's current playback so now-playing + lyrics still work.
 */
@Injectable({ providedIn: 'root' })
export class SpotifyService {
  readonly authed = signal(false);
  readonly status = signal<'idle' | 'connecting' | 'ready' | 'error'>('idle');
  readonly premiumError = signal(false);
  readonly insecure = signal(typeof window !== 'undefined' && !window.isSecureContext);
  readonly configured = signal(!!CLIENT_ID);

  readonly track = signal<Track | null>(null);
  readonly positionMs = signal(0);
  readonly paused = signal(true);
  readonly volume = signal(0.5);
  readonly onThisDevice = signal(false);

  private tokens: Tokens | null = this.loadTokens();
  private player: SpotifyPlayer | null = null;
  private deviceId: string | null = null;
  private sdkRequested = false;
  private fallbackTimer?: ReturnType<typeof setInterval>;
  private backoffUntil = 0;
  private lastTick = 0;

  constructor() {
    // Advance the progress bar between state updates.
    setInterval(() => this.tickPosition(), 250);

    void this.handleRedirect().then(() => {
      if (this.tokens) {
        this.authed.set(true);
        this.begin();
      }
    });
  }

  /** Kick off the PKCE authorize redirect. */
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
    this.tokens = null;
    localStorage.removeItem(TOKENS_KEY);
    this.player?.disconnect();
    this.player = null;
    if (this.fallbackTimer) clearInterval(this.fallbackTimer);
    this.authed.set(false);
    this.status.set('idle');
    this.track.set(null);
    this.onThisDevice.set(false);
  }

  // ---- transport controls (SDK if present, else Web API) ----
  async togglePlay(): Promise<void> {
    if (this.player) return void this.player.togglePlay();
    await this.command(this.paused() ? 'play' : 'pause', 'PUT');
    this.paused.update((p) => !p);
  }
  async next(): Promise<void> {
    if (this.player) return void this.player.nextTrack();
    await this.command('next', 'POST');
  }
  async prev(): Promise<void> {
    if (this.player) return void this.player.previousTrack();
    await this.command('previous', 'POST');
  }
  async seek(ms: number): Promise<void> {
    this.positionMs.set(ms);
    if (this.player) return void this.player.seek(ms);
    await this.api(`/me/player/seek?position_ms=${Math.floor(ms)}`, 'PUT');
  }
  setVolume(value: number): void {
    this.volume.set(value);
    void this.player?.setVolume(value);
  }

  // ---- auth ----
  private async handleRedirect(): Promise<void> {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code) return;
    // strip query regardless of outcome
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    history.replaceState({}, '', url.toString());

    if (state !== sessionStorage.getItem(STATE_KEY)) return;
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    if (!verifier) return;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    });
    await this.exchange(body);
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
  }

  private async exchange(body: URLSearchParams): Promise<void> {
    try {
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) return;
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
    } catch {
      /* ignore network errors */
    }
  }

  /** Valid access token, refreshing when close to expiry. */
  private async token(): Promise<string | null> {
    if (!this.tokens) return null;
    if (this.tokens.expiresAt - Date.now() < 60_000 && this.tokens.refresh) {
      await this.exchange(
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh,
          client_id: CLIENT_ID,
        }),
      );
    }
    return this.tokens?.access ?? null;
  }

  // ---- player / polling ----
  private begin(): void {
    if (this.insecure()) {
      this.startFallback();
      return;
    }
    this.status.set('connecting');
    this.loadSdk();
  }

  private loadSdk(): void {
    if (this.sdkRequested) return;
    this.sdkRequested = true;
    window.onSpotifyWebPlaybackSDKReady = () => this.createPlayer();
    if (window.Spotify) {
      this.createPlayer();
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  private createPlayer(): void {
    if (!window.Spotify) return;
    const player = new window.Spotify.Player({
      name: DEVICE_NAME,
      volume: this.volume(),
      getOAuthToken: (cb) => void this.token().then((t) => t && cb(t)),
    });
    this.player = player;

    player.addListener('ready', (payload) => {
      this.deviceId = (payload as { device_id: string }).device_id;
      this.status.set('ready');
      void this.transferHere();
    });
    player.addListener('not_ready', () => this.onThisDevice.set(false));
    player.addListener('player_state_changed', (state) => this.applyState(state));
    player.addListener('account_error', () => this.failToFallback());
    player.addListener('initialization_error', () => this.failToFallback());
    player.addListener('authentication_error', () => this.failToFallback());
    void player.connect();
  }

  private failToFallback(): void {
    this.premiumError.set(true);
    this.player?.disconnect();
    this.player = null;
    this.startFallback();
  }

  private applyState(raw: unknown): void {
    const state = raw as {
      paused: boolean;
      position: number;
      track_window?: { current_track?: SdkTrack };
    } | null;
    if (!state || !state.track_window?.current_track) {
      this.onThisDevice.set(false);
      return;
    }
    this.onThisDevice.set(true);
    this.paused.set(state.paused);
    this.positionMs.set(state.position);
    this.lastTick = performance.now();
    this.setTrack(state.track_window.current_track);
  }

  private setTrack(t: SdkTrack): void {
    const current = this.track();
    if (current?.id === t.id) return; // same track, keep it (lyrics won't re-fetch)
    this.track.set({
      id: t.id,
      title: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      album: t.album?.name ?? '',
      artUrl: t.album?.images?.[0]?.url ?? null,
      durationMs: t.duration_ms,
    });
  }

  private async transferHere(): Promise<void> {
    if (!this.deviceId) return;
    await this.api('/me/player', 'PUT', { device_ids: [this.deviceId], play: false });
  }

  private startFallback(): void {
    if (this.fallbackTimer) return;
    void this.pollNowPlaying();
    this.fallbackTimer = setInterval(() => void this.pollNowPlaying(), 5000);
  }

  private async pollNowPlaying(): Promise<void> {
    if (Date.now() < this.backoffUntil) return;
    const token = await this.token();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/me/player/currently-playing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        this.paused.set(true);
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
        item?: SdkTrack;
      };
      if (!json.item) return;
      this.paused.set(!json.is_playing);
      this.positionMs.set(json.progress_ms);
      this.lastTick = performance.now();
      this.setTrack(json.item);
    } catch {
      /* ignore */
    }
  }

  private async command(action: 'play' | 'pause' | 'next' | 'previous', method: string): Promise<void> {
    const path = action === 'play' || action === 'pause' ? `/me/player/${action}` : `/me/player/${action}`;
    await this.api(path, method);
  }

  private async api(path: string, method: string, body?: unknown): Promise<void> {
    const token = await this.token();
    if (!token) return;
    try {
      await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
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

interface SdkTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album?: { name?: string; images?: { url: string }[] };
}
