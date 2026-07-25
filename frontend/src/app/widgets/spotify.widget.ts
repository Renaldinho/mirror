import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SpotifyService } from './spotify/spotify.service';

/** Now-playing: connect to Spotify, stream on the mirror (Web Playback SDK), and
 *  control playback. Degrades to a read-only display when streaming isn't possible. */
@Component({
  selector: 'app-spotify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="np">
      @if (!sp.configured()) {
        <p class="hint">Add a Spotify Client ID in <code>spotify.config.ts</code> to enable this widget.</p>
      } @else if (!sp.authed()) {
        <div class="connect">
          <div class="logo">♫</div>
          <button class="btn" (click)="sp.login()">Connect Spotify</button>
        </div>
      } @else {
        <div class="cover">
          @if (sp.track()?.artUrl) {
            <img [src]="sp.track()!.artUrl" alt="" />
          } @else {
            <div class="cover-empty">♪</div>
          }
        </div>
        <div class="meta">
          <div class="title">{{ sp.track()?.title || 'Nothing playing' }}</div>
          <div class="artist">{{ sp.track()?.artists || '—' }}</div>
        </div>

        <div
          class="bar"
          role="slider"
          [attr.aria-valuenow]="pct()"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Seek"
          (pointerdown)="seek($event)"
        >
          <div class="fill" [style.width.%]="pct()"></div>
        </div>
        <div class="times">
          <span>{{ fmt(sp.positionMs()) }}</span>
          <span>{{ fmt(sp.track()?.durationMs ?? 0) }}</span>
        </div>

        <div class="controls">
          <button (click)="sp.prev()" aria-label="Previous">⏮</button>
          <button class="play" (click)="sp.togglePlay()" [attr.aria-label]="sp.paused() ? 'Play' : 'Pause'">
            {{ sp.paused() ? '▶' : '⏸' }}
          </button>
          <button (click)="sp.next()" aria-label="Next">⏭</button>
          <input
            class="vol"
            type="range"
            min="0"
            max="1"
            step="0.02"
            [value]="sp.volume()"
            (input)="sp.setVolume($any($event.target).valueAsNumber)"
            aria-label="Volume"
          />
        </div>

        @if (sp.onThisDevice()) {
          <div class="badge on">● streaming on this mirror</div>
        } @else if (sp.premiumError()) {
          <div class="badge warn">Premium needed to stream here — showing other devices</div>
        } @else if (sp.insecure()) {
          <div class="badge warn">Open on 127.0.0.1 / HTTPS to stream here</div>
        }

        <button class="logout" (click)="sp.logout()">disconnect</button>
      }
    </div>
  `,
  styles: [
    `
      .np { display: flex; height: 100%; flex-direction: column; gap: 8px; justify-content: center; }
      .hint { color: var(--theme-text-muted); font-size: 12px; text-align: center; }
      .hint code { color: var(--accent); }
      .connect { display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .logo {
        display: grid; width: 54px; height: 54px; place-items: center;
        border-radius: 50%; background: var(--theme-surface-soft); color: var(--accent); font-size: 28px;
      }
      .btn {
        padding: 8px 16px; border-radius: 999px; border: 1px solid var(--accent);
        background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--theme-text);
        font: 600 13px/1 var(--theme-font-body); cursor: pointer;
      }
      .cover { align-self: center; }
      .cover img, .cover-empty {
        width: 96px; height: 96px; border-radius: 8px; object-fit: cover;
        box-shadow: 0 8px 22px rgba(0, 0, 0, .4);
      }
      .cover-empty { display: grid; place-items: center; background: var(--theme-surface-soft); color: var(--accent); font-size: 32px; }
      .meta { text-align: center; }
      .title { color: var(--theme-text); font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .artist { color: var(--theme-text-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .bar { height: 5px; border-radius: 999px; background: var(--theme-surface-soft); cursor: pointer; overflow: hidden; }
      .fill { height: 100%; background: var(--accent); border-radius: 999px; }
      .times { display: flex; justify-content: space-between; font: 600 10px/1 var(--theme-font-body); color: var(--theme-text-muted); }
      .controls { display: flex; align-items: center; justify-content: center; gap: 10px; }
      .controls button { color: var(--theme-text); background: none; border: none; font-size: 17px; cursor: pointer; }
      .controls .play { font-size: 22px; color: var(--accent); }
      .vol { width: 64px; }
      .badge { text-align: center; font: 600 9px/1.3 var(--theme-font-body); letter-spacing: .04em; }
      .badge.on { color: var(--accent); }
      .badge.warn { color: var(--theme-warning, #d8a24a); }
      .logout { align-self: center; color: var(--theme-text-muted); background: none; border: none; font-size: 10px; text-transform: uppercase; letter-spacing: .18em; cursor: pointer; }
    `,
  ],
})
export class SpotifyWidget {
  readonly sp = inject(SpotifyService);

  readonly pct = computed(() => {
    const d = this.sp.track()?.durationMs ?? 0;
    return d ? Math.min(100, (this.sp.positionMs() / d) * 100) : 0;
  });

  fmt(ms: number): string {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  seek(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.sp.seek(ratio * (this.sp.track()?.durationMs ?? 0));
  }
}
