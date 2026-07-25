import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LrcLibResult, LyricLine, parseLrc } from './spotify/lrc';
import { SpotifyService } from './spotify/spotify.service';

type LyricsState = 'idle' | 'loading' | 'synced' | 'plain' | 'none';

/** Separate add-on widget: synced lyrics (lrclib) that track the Spotify position. */
@Component({
  selector: 'app-lyrics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lyrics">
      @if (!sp.authed()) {
        <p class="hint">Connect Spotify in the Now Playing widget to see lyrics.</p>
      } @else if (!sp.track()) {
        <p class="hint">Nothing playing.</p>
      } @else if (state() === 'loading') {
        <p class="hint">Finding lyrics…</p>
      } @else if (state() === 'none') {
        <p class="hint">No lyrics found for this track.</p>
      } @else if (state() === 'plain') {
        <pre class="plain">{{ plain() }}</pre>
      } @else {
        <div #scroll class="synced">
          @for (line of lines(); track $index) {
            <p class="line" [class.active]="$index === activeIndex()" [class.past]="$index < activeIndex()">
              {{ line.text || '♪' }}
            </p>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .lyrics { height: 100%; overflow: hidden; }
      .hint { display: grid; height: 100%; place-items: center; padding: 0 12px; color: var(--theme-text-muted); font-size: 13px; text-align: center; }
      .plain { height: 100%; margin: 0; overflow-y: auto; white-space: pre-wrap; color: var(--theme-text-muted); font: 400 13px/1.5 var(--theme-font-body); }
      .synced { height: 100%; overflow-y: auto; scroll-behavior: smooth; padding: 20% 6px; text-align: center; }
      .synced::-webkit-scrollbar { display: none; }
      .line { margin: 6px 0; font: 500 15px/1.35 var(--theme-font-display); color: var(--theme-text-muted); opacity: 0.5; transition: color 0.25s ease, opacity 0.25s ease, transform 0.25s ease; }
      .line.past { opacity: 0.32; }
      .line.active { color: var(--accent); opacity: 1; transform: scale(1.05); }
    `,
  ],
})
export class LyricsWidget {
  readonly sp = inject(SpotifyService);
  private readonly scrollRef = viewChild<ElementRef<HTMLElement>>('scroll');

  readonly lines = signal<LyricLine[]>([]);
  readonly plain = signal<string | null>(null);
  readonly state = signal<LyricsState>('idle');

  private token = 0;

  readonly activeIndex = computed(() => {
    const list = this.lines();
    const pos = this.sp.positionMs();
    let index = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i].tMs <= pos) index = i;
      else break;
    }
    return index;
  });

  constructor() {
    // Re-fetch whenever the track changes.
    effect(() => {
      const track = this.sp.track();
      if (track) void this.fetchLyrics(track.title, track.artists, track.album, track.durationMs);
      else this.reset();
    });

    // Keep the active line centered.
    effect(() => {
      const index = this.activeIndex();
      const host = this.scrollRef()?.nativeElement;
      if (!host || index < 0) return;
      const line = host.children[index] as HTMLElement | undefined;
      if (line) line.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  private reset(): void {
    this.lines.set([]);
    this.plain.set(null);
    this.state.set('idle');
  }

  private async fetchLyrics(title: string, artists: string, album: string, durationMs: number): Promise<void> {
    const request = ++this.token;
    this.state.set('loading');
    this.lines.set([]);
    this.plain.set(null);

    const primaryArtist = artists.split(',')[0].trim();
    const result =
      (await this.get(title, primaryArtist, album, Math.round(durationMs / 1000))) ??
      (await this.search(title, primaryArtist));

    if (request !== this.token) return; // a newer track superseded this fetch

    if (result?.syncedLyrics) {
      this.lines.set(parseLrc(result.syncedLyrics));
      this.state.set('synced');
    } else if (result?.plainLyrics) {
      this.plain.set(result.plainLyrics);
      this.state.set('plain');
    } else {
      this.state.set('none');
    }
  }

  private async get(track: string, artist: string, album: string, duration: number): Promise<LrcLibResult | null> {
    const params = new URLSearchParams({ track_name: track, artist_name: artist, album_name: album, duration: String(duration) });
    return this.request(`https://lrclib.net/api/get?${params.toString()}`);
  }

  private async search(track: string, artist: string): Promise<LrcLibResult | null> {
    const params = new URLSearchParams({ track_name: track, artist_name: artist });
    const list = await this.request<LrcLibResult[]>(`https://lrclib.net/api/search?${params.toString()}`);
    if (!Array.isArray(list)) return null;
    return list.find((r) => r.syncedLyrics) ?? list.find((r) => r.plainLyrics) ?? null;
  }

  private async request<T = LrcLibResult>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }
}
