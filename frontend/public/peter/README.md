# Peter face assets

Drop Peter Griffin artwork here. The mirror swaps these by state (see
`src/app/face/faces.ts`). Files in `public/` are served from the site root, so
`public/peter/online.gif` is fetched as `/peter/online.gif`.

## Required files

| State      | File           | Shown when                                    |
|------------|----------------|-----------------------------------------------|
| online     | `online.gif`   | connected, idle ("online")                    |
| offline    | `offline.png`  | backend unreachable / socket closed           |
| thinking   | `thinking.gif` | your message sent, Peter hasn't replied yet   |
| talking    | `talking.gif`  | Peter is streaming a reply                    |

## Recommendations

- Roughly **square**, transparent background (PNG/GIF/WebP all work).
- Keep them reasonably small — this runs on a Raspberry Pi 4 kiosk.
- Animated `talking.gif` (mouth moving) and `thinking.gif` (looking around) sell
  the effect best; `offline` can be a still.

## Missing files are safe

Until a file exists, that state falls back to a labeled placeholder circle — the
app won't break. Add or replace files anytime; no code change needed. To rename a
file or change an extension, edit the single map in `src/app/face/faces.ts`.
