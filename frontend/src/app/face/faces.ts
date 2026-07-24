import { PeterStatus } from '../core/ws.service';

/**
 * Where each state's artwork lives. Files are served from `frontend/public/`,
 * so `/peter/online.gif` maps to `frontend/public/peter/online.gif`. Swap
 * extensions/filenames here in one place; the UI never hardcodes paths.
 */
export const FACE_SRC: Record<PeterStatus, string> = {
  idle: '/peter/online.gif',
  offline: '/peter/offline.png',
  thinking: '/peter/thinking.gif',
  talking: '/peter/talking.gif',
};

/** Short human label per state, used by the placeholder fallback. */
export const FACE_LABEL: Record<PeterStatus, string> = {
  idle: 'online',
  offline: 'offline',
  thinking: 'thinking…',
  talking: 'talking',
};
