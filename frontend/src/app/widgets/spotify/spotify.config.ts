/**
 * Spotify integration config. Fill in CLIENT_ID (or set window.__SPOTIFY_CLIENT_ID__
 * in index.html for kiosk builds). The redirect URI must EXACTLY match one registered
 * in the Spotify dashboard and be a secure/loopback origin — for dev, serve on
 * http://127.0.0.1:4200/ (NOT localhost).
 */

/** Minimal Web Playback SDK surface we use. */
export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: string, cb: (payload: unknown) => void): boolean;
  getCurrentState(): Promise<unknown>;
  setVolume(value: number): Promise<void>;
  togglePlay(): Promise<void>;
  seek(ms: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement?(): Promise<void>;
}
interface SpotifyNamespace {
  Player: new (options: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }) => SpotifyPlayer;
}

declare global {
  interface Window {
    __SPOTIFY_CLIENT_ID__?: string;
    __SPOTIFY_REDIRECT__?: string;
    Spotify?: SpotifyNamespace;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

export const CLIENT_ID: string =
  (typeof window !== 'undefined' && window.__SPOTIFY_CLIENT_ID__) || '04a63c02d2914d16abdbd7e8322cde03';

export const REDIRECT_URI: string =
  (typeof window !== 'undefined' && window.__SPOTIFY_REDIRECT__) ||
  (typeof window !== 'undefined' ? `${window.location.origin}/` : '');

export const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

export const AUTH_URL = 'https://accounts.spotify.com/authorize';
export const TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const API_BASE = 'https://api.spotify.com/v1';
export const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';
export const DEVICE_NAME = 'La Fleur Mirror';
