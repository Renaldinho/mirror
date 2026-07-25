/**
 * Public Spotify PKCE configuration, supplied at runtime by /config.js. No
 * Spotify client secret belongs in this browser application.
 */
declare global {
  interface Window {
    __MIRROR_CONFIG__?: {
      spotifyClientId?: string;
      spotifyRedirectUri?: string;
    };
  }
}

export const CLIENT_ID =
  (typeof window !== 'undefined' && window.__MIRROR_CONFIG__?.spotifyClientId?.trim()) || '';

export const REDIRECT_URI =
  (typeof window !== 'undefined' && window.__MIRROR_CONFIG__?.spotifyRedirectUri?.trim()) ||
  (typeof window !== 'undefined' ? `${window.location.origin}/` : '');

export const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

export const AUTH_URL = 'https://accounts.spotify.com/authorize';
export const TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const API_BASE = 'https://api.spotify.com/v1';
