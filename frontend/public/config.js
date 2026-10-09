// Public runtime configuration. PKCE uses a public Spotify client ID; never put
// a Spotify client secret or another private value in this browser-loaded file.
window.__MIRROR_CONFIG__ = {
  spotifyClientId: '04a63c02d2914d16abdbd7e8322cde03',
  // Local Angular development uses 4200; the installed Pi uses 80.
  spotifyRedirectUri: window.location.port === '4200'
    ? 'http://127.0.0.1:4200/'
    : 'http://127.0.0.1:80/',
};
