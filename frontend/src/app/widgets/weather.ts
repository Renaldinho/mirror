import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetVariantId } from '../dashboard/widget-registry';

interface Forecast {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
  };
}
interface GeoResult {
  results?: { name: string; latitude: number; longitude: number; country_code?: string }[];
}
interface SavedLoc {
  label: string;
  lat: number;
  lon: number;
}

const LOC_KEY = 'dash.weather.loc';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** WMO weather_code → glyph + label. */
function describe(code: number, isDay: boolean): { icon: string; text: string } {
  if (code === 0) return { icon: isDay ? '☀' : '☽', text: 'Clear' };
  if (code <= 2) return { icon: isDay ? '🌤' : '☁', text: 'Fair' };
  if (code === 3) return { icon: '☁', text: 'Overcast' };
  if (code <= 48) return { icon: '🌫', text: 'Fog' };
  if (code <= 57) return { icon: '🌦', text: 'Drizzle' };
  if (code <= 67) return { icon: '🌧', text: 'Rain' };
  if (code <= 77) return { icon: '🌨', text: 'Snow' };
  if (code <= 82) return { icon: '🌧', text: 'Showers' };
  if (code <= 86) return { icon: '🌨', text: 'Snow showers' };
  return { icon: '⛈', text: 'Thunderstorm' };
}

@Component({
  selector: 'app-weather',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col">
      @if (state() === 'ready') {
        @if (variant() === 'compact') {
          <div class="compact-weather">
            <div class="compact-icon">{{ cond().icon }}</div>
            <div class="compact-reading">
              <div class="compact-temp">{{ temp() }}°</div>
              <div class="condition">{{ cond().text }}</div>
            </div>
            <div class="compact-place">
              <strong>{{ place() }}</strong>
              <span>wind {{ wind() }} km/h</span>
              <button (click)="state.set('search')">change</button>
            </div>
          </div>
        } @else {
          <div class="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <div class="text-5xl leading-none">{{ cond().icon }}</div>
            <div class="text-4xl font-medium text-parchment tabular-nums">{{ temp() }}°</div>
            <div class="text-sm uppercase tracking-[0.2em] text-gold">{{ cond().text }}</div>
            <div class="mt-1 text-xs text-parchment-dim">{{ place() }} · wind {{ wind() }} km/h</div>
          </div>
          <button
            class="self-center text-[10px] uppercase tracking-[0.2em] text-parchment-dim
                   hover:text-gold"
            (click)="state.set('search')"
          >
            change location
          </button>
        }
      } @else if (state() === 'loading') {
        <div class="flex flex-1 items-center justify-center text-sm text-parchment-dim">
          reading the skies…
        </div>
      } @else {
        <!-- search / need-location -->
        <div class="flex flex-1 flex-col items-center justify-center gap-3 px-3 text-center">
          @if (error()) { <p class="text-xs text-oxblood-accent">{{ error() }}</p> }
          <button
            class="rounded border border-gold/50 px-3 py-1 text-sm text-gold hover:bg-gold/10"
            (click)="useMyLocation()"
          >
            use my location
          </button>
          <div class="text-[10px] uppercase tracking-[0.2em] text-parchment-dim">or</div>
          <form class="flex w-full gap-2" (ngSubmit)="searchCity()">
            <input
              class="min-w-0 flex-1 border-b border-gold/40 bg-transparent px-1 py-0.5 text-sm
                     text-parchment placeholder:text-parchment-dim/60 outline-none"
              placeholder="search a city…"
              [(ngModel)]="query"
              name="q"
              autocomplete="off"
            />
            <button class="text-sm text-gold hover:text-gold-bright" type="submit">↵</button>
          </form>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .compact-weather {
        display: grid;
        grid-template-columns: 72px 1fr minmax(100px, auto);
        align-items: center;
        height: 100%;
        gap: 14px;
        text-align: left;
      }
      .compact-icon {
        font-size: 3.3rem;
        line-height: 1;
        text-align: center;
        filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 28%, transparent));
      }
      .compact-reading {
        min-width: 0;
        border-left: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
        padding-left: 14px;
      }
      .compact-temp {
        color: var(--theme-text);
        font: 500 2.7rem/1 var(--theme-font-display);
        font-variant-numeric: tabular-nums;
      }
      .condition {
        overflow: hidden;
        color: var(--accent);
        font-size: .66rem;
        letter-spacing: .18em;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .compact-place {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 3px;
        color: var(--theme-text-muted);
        font-size: .68rem;
      }
      .compact-place strong {
        overflow: hidden;
        color: var(--theme-text);
        font-weight: 500;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .compact-place button {
        width: max-content;
        margin-top: 4px;
        color: var(--accent);
        font-size: .58rem;
        letter-spacing: .16em;
        text-transform: uppercase;
      }
    `,
  ],
})
export class WeatherWidget {
  private readonly http = inject(HttpClient);

  readonly variant = input<WidgetVariantId>('stacked');
  readonly state = signal<'loading' | 'ready' | 'search'>('loading');
  readonly temp = signal(0);
  readonly wind = signal(0);
  readonly cond = signal(describe(0, true));
  readonly place = signal('');
  readonly error = signal('');
  query = '';

  constructor() {
    const saved = this.loadLoc();
    if (saved) this.fetch(saved);
    else this.state.set('search');
  }

  useMyLocation(): void {
    this.error.set('');
    if (!navigator.geolocation) {
      this.error.set('Geolocation unavailable — search instead.');
      return;
    }
    this.state.set('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => this.fetch({ label: 'Here', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        this.error.set('Location denied — search a city.');
        this.state.set('search');
      },
      { timeout: 8000 },
    );
  }

  searchCity(): void {
    const name = this.query.trim();
    if (!name) return;
    this.state.set('loading');
    this.http
      .get<GeoResult>(GEOCODE_URL, { params: { name, count: 1, language: 'en', format: 'json' } })
      .subscribe({
        next: (r) => {
          const hit = r.results?.[0];
          if (!hit) {
            this.error.set(`No match for “${name}”.`);
            this.state.set('search');
            return;
          }
          this.fetch({ label: hit.name, lat: hit.latitude, lon: hit.longitude });
        },
        error: () => this.fail(),
      });
  }

  private fetch(loc: SavedLoc): void {
    this.state.set('loading');
    this.http
      .get<Forecast>(FORECAST_URL, {
        params: {
          latitude: loc.lat,
          longitude: loc.lon,
          current: 'temperature_2m,weather_code,is_day,wind_speed_10m',
          timezone: 'auto',
        },
      })
      .subscribe({
        next: (f) => {
          this.temp.set(Math.round(f.current.temperature_2m));
          this.wind.set(Math.round(f.current.wind_speed_10m));
          this.cond.set(describe(f.current.weather_code, f.current.is_day === 1));
          this.place.set(loc.label);
          this.saveLoc(loc);
          this.state.set('ready');
        },
        error: () => this.fail(),
      });
  }

  private fail(): void {
    this.error.set('Could not reach the weather service.');
    this.state.set('search');
  }

  private saveLoc(loc: SavedLoc): void {
    localStorage.setItem(LOC_KEY, JSON.stringify(loc));
  }
  private loadLoc(): SavedLoc | null {
    try {
      const raw = localStorage.getItem(LOC_KEY);
      return raw ? (JSON.parse(raw) as SavedLoc) : null;
    } catch {
      return null;
    }
  }
}
