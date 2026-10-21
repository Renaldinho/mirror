import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { DashboardService } from '../dashboard/dashboard.service';
import { SettingsService } from '../dashboard/settings.service';
import { DEFAULT_RINGTONE, getRingtone, RINGTONES } from './ringtones';

interface AlarmSettings { time: string; enabled: boolean; nextAt: number | null; ringtone: string }
const STORAGE_KEY = 'dash.alarm.v1';
const VALID_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

@Injectable({ providedIn: 'root' })
export class AlarmService {
  readonly settings = signal<AlarmSettings>(this.load());
  readonly ringing = signal(false);
  readonly soundError = signal<string | null>(null);
  readonly nextLabel = computed(() => {
    const nextAt = this.settings().nextAt;
    return nextAt === null ? 'Alarm off' : new Date(nextAt).toLocaleString([], {
      weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  });
  /** The currently selected ringtone (sound + popup face). */
  readonly ringtone = computed(() => getRingtone(this.settings().ringtone));
  private readonly dashboard = inject(DashboardService);
  private readonly preferences = inject(SettingsService);
  private audio: HTMLAudioElement | null = null;

  constructor() {
    effect(() => {
      const volume = this.preferences.effectiveVolume();
      if (this.audio) this.audio.volume = volume;
    });
    effect((onCleanup) => {
      const settings = this.settings();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      if (!this.dashboard.isActive('alarm')) {
        if (settings.enabled) this.setEnabled(false);
        this.dismiss();
        return;
      }
      if (!settings.enabled || settings.nextAt === null) return;
      const timer = setTimeout(() => {
        this.settings.update((value) => ({ ...value, enabled: false, nextAt: null }));
        this.test();
      }, Math.max(0, settings.nextAt - Date.now()));
      onCleanup(() => clearTimeout(timer));
    });
    inject(DestroyRef).onDestroy(() => this.dismiss());
  }

  setTime(time: string): void {
    if (!VALID_TIME.test(time)) return;
    this.settings.update((value) => ({
      ...value, time, nextAt: value.enabled ? this.nextOccurrence(time) : null,
    }));
  }

  setEnabled(enabled: boolean): void {
    this.dismiss();
    this.settings.update((value) => ({
      ...value, enabled, nextAt: enabled ? this.nextOccurrence(value.time) : null,
    }));
  }

  /** Arm a one-off alarm a fixed number of minutes from now (relative mode). */
  ringIn(minutes: number): void {
    this.dismiss();
    const nextAt = Date.now() + Math.max(1, Math.round(minutes)) * 60_000;
    const time = new Date(nextAt).toTimeString().slice(0, 5);
    this.settings.update((value) => ({ ...value, time, enabled: true, nextAt }));
  }

  setRingtone(ringtone: string): void {
    if (!RINGTONES.some((r) => r.id === ringtone)) return;
    this.dismiss();
    this.audio = null; // next play loads the newly selected sound
    this.settings.update((value) => ({ ...value, ringtone }));
  }

  test(): void {
    this.ringing.set(true);
    this.playSound();
  }

  playSound(): void {
    const source = this.ringtone().sound;
    if (!this.audio || !this.audio.src.endsWith(source)) {
      this.audio?.pause();
      this.audio = new Audio(source);
    }
    const audio = this.audio;
    audio.volume = this.preferences.effectiveVolume();
    audio.loop = true;
    this.soundError.set(null);
    void audio.play().catch((error: unknown) => {
      if (!this.ringing()) return;
      this.soundError.set(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Tap Play sound to let Petah wake you up.'
        : 'The ringtone could not play. Check the mirror audio and try again.');
    });
  }

  dismiss(): void {
    this.ringing.set(false);
    this.soundError.set(null);
    if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; }
  }

  snooze(): void {
    this.dismiss();
    this.settings.update((value) => ({ ...value, enabled: true, nextAt: Date.now() + 5 * 60_000 }));
  }

  private nextOccurrence(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
    return next.getTime();
  }

  private load(): AlarmSettings {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<AlarmSettings> | null;
      if (saved && typeof saved.time === 'string' && VALID_TIME.test(saved.time)) {
        const nextAt = typeof saved.nextAt === 'number' && Number.isFinite(saved.nextAt) && saved.nextAt > 0
          ? saved.nextAt : null;
        const ringtone = typeof saved.ringtone === 'string' && RINGTONES.some((r) => r.id === saved.ringtone)
          ? saved.ringtone : DEFAULT_RINGTONE;
        return { time: saved.time, enabled: saved.enabled === true && nextAt !== null, nextAt, ringtone };
      }
    } catch { /* Use a disabled default for damaged storage. */ }
    return { time: '07:00', enabled: false, nextAt: null, ringtone: DEFAULT_RINGTONE };
  }
}
