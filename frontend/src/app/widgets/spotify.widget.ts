import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * PHASE 2 STUB — design only. No network, no OAuth.
 * This renders the intended "now playing" layout so the aesthetic is settled.
 * Phase 2 wires: client-side Spotify PKCE auth, poll /v1/me/player/currently-playing,
 * and lrclib.net lyrics. The "Connect Spotify" button is intentionally disabled.
 */
@Component({
  selector: 'app-spotify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-3">
      <div class="flex gap-3">
        <!-- album-art placeholder -->
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-gold/40
                 bg-oxblood text-2xl text-gold/70"
        >
          ♪
        </div>
        <div class="flex min-w-0 flex-col justify-center">
          <div class="truncate text-base text-parchment">Nothing playing</div>
          <div class="truncate text-sm text-parchment-dim">— · —</div>
        </div>
      </div>

      <!-- progress bar -->
      <div class="h-1 w-full overflow-hidden rounded-full bg-wine-2">
        <div class="h-full w-1/3 bg-gold/70"></div>
      </div>
      <div class="flex justify-between text-[10px] tabular-nums text-parchment-dim">
        <span>0:00</span><span>—:—</span>
      </div>

      <div class="mt-auto flex flex-col items-center gap-1">
        <button
          class="cursor-not-allowed rounded border border-gold/40 px-3 py-1 text-sm text-parchment-dim"
          disabled
          title="Coming in a later phase"
        >
          Connect Spotify
        </button>
        <span class="text-[10px] uppercase tracking-[0.2em] text-parchment-dim/60">preview</span>
      </div>
    </div>
  `,
})
export class SpotifyWidget {}
