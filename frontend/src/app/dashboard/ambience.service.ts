import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { SettingsService } from './settings.service';

interface SunTimes {
  sunrise: number;
  sunset: number;
}
interface SavedLoc {
  lat: number;
  lon: number;
}
interface OpenMeteoDaily {
  daily?: { sunrise?: string[]; sunset?: string[] };
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
/** Brightness at midday vs deep night, and the fade half-window around dusk/dawn. */
const DAY_LEVEL = 85;
const NIGHT_LEVEL = 22;
const FADE_MS = 45 * 60 * 1000;

/**
 * Auto-dim the smart mirror by time of day: bright through the day, easing down
 * around sunset and back up around sunrise. Only modulates brightness while the
 * lighting is on (mirror-off is respected) and never changes the theme. Uses the
 * weather widget's saved location for real sun times, or a clock fallback.
 */
@Injectable({ providedIn: 'root' })
export class AmbienceService {
  private readonly settings = inject(SettingsService);
  private readonly http = inject(HttpClient);

  readonly autoLight = signal(this.loadAuto());

  private sun: SunTimes | null = null;
  private sunDay = '';

  constructor() {
    effect(() => localStorage.setItem('dash.ambience.auto', JSON.stringify(this.autoLight())));
    this.apply();
    const id = setInterval(() => this.apply(), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  /** Turned off automatically whenever the user takes manual control. */
  disableAuto(): void {
    this.autoLight.set(false);
  }

  toggleAuto(): void {
    this.autoLight.update((value) => !value);
    if (this.autoLight()) this.apply();
  }

  private apply(): void {
    if (!this.autoLight() || !this.settings.bgOn()) return;
    this.ensureSun(new Date());
    this.settings.setLight(Math.round(this.targetLevel(Date.now())));
  }

  private targetLevel(now: number): number {
    const sun = this.sun;
    if (!sun) return DAY_LEVEL;
    if (now <= sun.sunrise - FADE_MS) return NIGHT_LEVEL;
    if (now < sun.sunrise + FADE_MS) {
      return lerp(NIGHT_LEVEL, DAY_LEVEL, (now - (sun.sunrise - FADE_MS)) / (2 * FADE_MS));
    }
    if (now <= sun.sunset - FADE_MS) return DAY_LEVEL;
    if (now < sun.sunset + FADE_MS) {
      return lerp(DAY_LEVEL, NIGHT_LEVEL, (now - (sun.sunset - FADE_MS)) / (2 * FADE_MS));
    }
    return NIGHT_LEVEL;
  }

  /** Refresh sun times once per day: fallback immediately, refine from the API. */
  private ensureSun(date: Date): void {
    const key = date.toDateString();
    if (this.sunDay === key && this.sun) return;
    this.sunDay = key;
    this.sun = this.fallbackSun(date);

    const loc = this.loadLoc();
    if (!loc) return;
    this.http
      .get<OpenMeteoDaily>(FORECAST_URL, {
        params: {
          latitude: loc.lat,
          longitude: loc.lon,
          daily: 'sunrise,sunset',
          timezone: 'auto',
        },
      })
      .subscribe({
        next: (r) => {
          const sunrise = r.daily?.sunrise?.[0];
          const sunset = r.daily?.sunset?.[0];
          if (sunrise && sunset) {
            this.sun = { sunrise: new Date(sunrise).getTime(), sunset: new Date(sunset).getTime() };
            this.apply();
          }
        },
        error: () => {},
      });
  }

  private fallbackSun(date: Date): SunTimes {
    const sunrise = new Date(date);
    sunrise.setHours(7, 0, 0, 0);
    const sunset = new Date(date);
    sunset.setHours(19, 30, 0, 0);
    return { sunrise: sunrise.getTime(), sunset: sunset.getTime() };
  }

  private loadLoc(): SavedLoc | null {
    try {
      const raw = localStorage.getItem('dash.weather.loc');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedLoc;
      return Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lon) ? parsed : null;
    } catch {
      return null;
    }
  }

  private loadAuto(): boolean {
    const raw = localStorage.getItem('dash.ambience.auto');
    return raw === null ? true : raw === 'true';
  }
}

function lerp(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return a + (b - a) * clamped;
}
