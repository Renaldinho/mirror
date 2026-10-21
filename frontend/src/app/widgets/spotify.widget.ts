import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SpotifyService } from './spotify/spotify.service';
import { SettingsService } from '../dashboard/settings.service';
import { themeFlavor } from '../dashboard/theme-flavor';
import { UiIcon } from '../shared/ui-icon';

/** Now-playing display and remote controls for the user's active Spotify device. */
@Component({
  selector: 'app-spotify',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (collapsed()) {
      <div class="mini">
        @if (!sp.configured()) {
          <span class="mini-title muted">Spotify is not configured</span>
        } @else if (!sp.authed()) {
          <button class="btn" (click)="sp.login()">{{ flavor().connect }}</button>
          @if (sp.error()) { <span class="mini-title muted" role="status">{{ sp.error() }}</span> }
        } @else if (!sp.track()) {
          <div class="mini-art empty">♪</div>
          <span class="mini-title muted" role="status">{{ sp.error() || 'Start playing on a Spotify device' }}</span>
        } @else {
          @if (sp.track()?.artUrl) {
            <img class="mini-art" [src]="sp.track()!.artUrl" alt="" />
          } @else {
            <div class="mini-art empty">♪</div>
          }
          <div class="mini-meta">
            <span class="mini-title">{{ sp.track()?.title || flavor().nothingPlaying }}</span>
            <span class="mini-artist">{{ sp.track()?.artists || '—' }}</span>
          </div>
          <div class="mini-ctrls">
            <button (click)="sp.prev()" aria-label="Previous"><app-ui-icon name="previous" /></button>
            <button class="mini-play" (click)="sp.togglePlay()" [attr.aria-label]="sp.paused() ? 'Play' : 'Pause'">
              <app-ui-icon [name]="sp.paused() ? 'play' : 'pause'" />
            </button>
            <button (click)="sp.next()" aria-label="Next"><app-ui-icon name="next" /></button>
          </div>
          <div
            class="mini-bar"
            role="slider"
            [attr.aria-valuenow]="pct()"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Seek"
            (pointerdown)="seek($event)"
          >
            <div class="mini-fill" [style.width.%]="pct()"></div>
          </div>
        }
      </div>
    } @else {
    <div class="np">
      @if (!sp.configured()) {
        <p class="hint">Spotify is not configured on this mirror.</p>
      } @else if (!sp.authed()) {
        <div class="connect">
          <div class="logo">♫</div>
          <button class="btn" (click)="sp.login()">{{ flavor().connect }}</button>
          @if (sp.error()) { <p class="hint" role="status">{{ sp.error() }}</p> }
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
          <div class="title">{{ sp.track()?.title || sp.error() || flavor().nothingPlaying }}</div>
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
          <button (click)="sp.prev()" aria-label="Previous"><app-ui-icon name="previous" /></button>
          <button class="play" (click)="sp.togglePlay()" [attr.aria-label]="sp.paused() ? 'Play' : 'Pause'">
            <app-ui-icon [name]="sp.paused() ? 'play' : 'pause'" />
          </button>
          <button (click)="sp.next()" aria-label="Next"><app-ui-icon name="next" /></button>
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

        @if (sp.error()) {
          <div class="badge warn" role="status">{{ sp.error() }}</div>
        } @else if (sp.premiumError()) {
          <div class="badge warn">Spotify Premium required to control playback</div>
        } @else if (sp.hasDevice()) {
          <div class="badge on">▷ {{ sp.deviceName() }}</div>
        } @else {
          <div class="badge warn">Start playing on any Spotify device</div>
        }

        <button class="logout" (click)="sp.logout()">disconnect</button>
      }
    </div>
    }
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

      .mini { position: relative; display: flex; align-items: center; gap: 10px; height: 100%; padding-bottom: 4px; }
      .mini-art { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex: none; box-shadow: 0 4px 12px rgba(0, 0, 0, .4); }
      .mini-art.empty { display: grid; place-items: center; background: var(--theme-surface-soft); color: var(--accent); font-size: 20px; }
      .mini-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
      .mini-title { color: var(--theme-text); font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mini-title.muted { color: var(--theme-text-muted); font-weight: 400; }
      .mini-artist { color: var(--theme-text-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mini-ctrls { flex: none; display: flex; align-items: center; gap: 6px; }
      .mini-ctrls button { background: none; border: none; color: var(--theme-text); font-size: 14px; cursor: pointer; line-height: 1; }
      .mini-ctrls .mini-play { color: var(--accent); font-size: 18px; }
      .mini-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; border-radius: 999px; background: var(--theme-surface-soft); cursor: pointer; overflow: hidden; }
      .mini-fill { height: 100%; background: var(--accent); border-radius: 999px; }
    `,
  ],
})
export class SpotifyWidget {
  readonly sp = inject(SpotifyService);
  private readonly settings = inject(SettingsService);
  readonly collapsed = input(false);
  readonly flavor = computed(() => themeFlavor(this.settings.theme()));

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
