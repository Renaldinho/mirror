// Where the backend WebSocket lives. Override at runtime by setting
// window.__PETER_WS__ (e.g. in index.html) when the Pi points at a remote host.
declare global {
  interface Window {
    __PETER_WS__?: string;
  }
}

export const WS_URL: string =
  (typeof window !== 'undefined' && window.__PETER_WS__) || 'ws://localhost:8000/ws';
