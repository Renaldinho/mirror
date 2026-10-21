import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AudioFx } from './audio';
import { GamesService } from './games.service';
import { SettingsService } from '../dashboard/settings.service';

describe('arcade audio', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

  it('reuses one context, preloads the recorded blast and applies game and global mute', async () => {
    localStorage.clear();
    const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
    const master = { gain: param(), connect: vi.fn() };
    const gain = { gain: param(), connect: vi.fn() };
    const oscillator = { frequency: param(), connect: vi.fn(() => gain), start: vi.fn(), stop: vi.fn() };
    const source = { connect: vi.fn(() => gain), start: vi.fn(), buffer: null };
    const sample = {} as AudioBuffer;
    const fetchSample = vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }));
    vi.stubGlobal('fetch', fetchSample);
    const ctx = {
      state: 'suspended', currentTime: 0, destination: {}, sampleRate: 8000,
      createGain: vi.fn().mockReturnValueOnce(master).mockReturnValue(gain),
      createOscillator: vi.fn(() => oscillator), createBufferSource: vi.fn(() => source),
      createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(1000) })),
      resume: vi.fn(() => Promise.resolve()), close: vi.fn(() => Promise.resolve()),
      decodeAudioData: vi.fn(() => Promise.resolve(sample)),
    };
    const ctor = vi.fn(function () { return ctx; });
    vi.stubGlobal('AudioContext', ctor);
    const settings = TestBed.inject(SettingsService);
    const games = TestBed.inject(GamesService);
    const audio = TestBed.inject(AudioFx);
    settings.setVolume(.4);
    audio.play('start');
    audio.play('bonk');
    audio.play('pop');
    audio.play('miss');
    audio.play('record');
    expect(ctor).toHaveBeenCalledOnce();
    expect(oscillator.start).toHaveBeenCalledTimes(10);
    expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(.4, 0);
    await vi.waitFor(() => expect(ctx.decodeAudioData).toHaveBeenCalledOnce());
    await Promise.resolve();
    audio.play('shot');
    expect(source.buffer).toBe(sample);
    expect(fetchSample).toHaveBeenCalledExactlyOnceWith('/sounds/shotgun.wav');
    expect(source.connect).toHaveBeenLastCalledWith(master);
    games.toggleMute();
    TestBed.tick();
    expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    audio.play('shot');
    expect(oscillator.start).toHaveBeenCalledTimes(10);
    games.toggleMute();
    settings.audioMuted.set(true);
    TestBed.tick();
    expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    settings.audioMuted.set(false);
    TestBed.tick();
    expect(master.gain.setValueAtTime).toHaveBeenLastCalledWith(.4, 0);
  });
});
