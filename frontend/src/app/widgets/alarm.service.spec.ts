import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DashboardService } from '../dashboard/dashboard.service';
import { AlarmService } from './alarm.service';
import { SettingsService } from '../dashboard/settings.service';

describe('one-time mirror alarm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 6, 59, 30));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    TestBed.inject(DashboardService).add('alarm');
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rings once at the selected local time and stops the looping laugh on dismissal', async () => {
    const alarm = TestBed.inject(AlarmService);
    alarm.setTime('07:00');
    alarm.setEnabled(true);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(29_000);
    expect(alarm.ringing()).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(alarm.ringing()).toBe(true);
    expect(alarm.settings().enabled).toBe(false);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.instances[0] as HTMLAudioElement;
    expect(audio.loop).toBe(true);
    expect(audio.src).toContain('/alarms/peter-laugh-T1G4wNahcFA.m4a');
    alarm.dismiss();
    expect(alarm.ringing()).toBe(false);
    expect(audio.currentTime).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it('schedules a time that has passed for tomorrow, and rejects invalid times', () => {
    const alarm = TestBed.inject(AlarmService);
    alarm.setTime('06:00');
    alarm.setEnabled(true);
    expect(alarm.settings().nextAt).toBe(new Date(2026, 9, 12, 6, 0).getTime());
    alarm.setTime('24:99');
    expect(alarm.settings().time).toBe('06:00');
  });

  it('replaces the old timer when the time changes and cancels it when disabled', async () => {
    const alarm = TestBed.inject(AlarmService);
    alarm.setEnabled(true);
    TestBed.tick();
    alarm.setTime('07:01');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(alarm.ringing()).toBe(false);
    alarm.setEnabled(false);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(alarm.ringing()).toBe(false);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it('snoozes for five minutes and cancels the alarm when its widget is removed', async () => {
    const alarm = TestBed.inject(AlarmService);
    alarm.test();
    alarm.snooze();
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(299_000);
    expect(alarm.ringing()).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(alarm.ringing()).toBe(true);
    alarm.snooze();
    TestBed.inject(DashboardService).remove('alarm');
    TestBed.tick();
    expect(alarm.settings().enabled).toBe(false);
    await vi.advanceTimersByTimeAsync(300_000);
    expect(alarm.ringing()).toBe(false);
  });

  it('restores a saved alarm across a reload', async () => {
    localStorage.setItem('dash.alarm.v1', JSON.stringify({
      time: '07:00', enabled: true, nextAt: new Date(2026, 9, 11, 7, 0).getTime(),
    }));
    const alarm = TestBed.inject(AlarmService);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(alarm.ringing()).toBe(true);
  });

  it('offers a sound retry if the browser blocks autoplay', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
    const alarm = TestBed.inject(AlarmService);
    alarm.test();
    await Promise.resolve();
    expect(alarm.ringing()).toBe(true);
    expect(alarm.soundError()).toContain('Tap Play sound');
    alarm.playSound();
    await Promise.resolve();
    expect(alarm.soundError()).toBeNull();
  });

  it('applies volume and mute to an alarm that is already playing', () => {
    const settings = TestBed.inject(SettingsService);
    const alarm = TestBed.inject(AlarmService);
    settings.setVolume(.3);
    alarm.test();
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.instances[0] as HTMLAudioElement;
    expect(audio.volume).toBe(.3);
    settings.audioMuted.set(true);
    TestBed.tick();
    expect(audio.volume).toBe(0);
    settings.audioMuted.set(false);
    TestBed.tick();
    expect(audio.volume).toBe(.3);
  });
});
