import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-cursor-fx');
    TestBed.configureTestingModule({});
  });

  it('defaults to Bare Mirror with code rain', () => {
    const settings = TestBed.inject(SettingsService);

    expect(settings.theme()).toBe('bare');
    expect(settings.matrixRain()).toBe(true);
  });

  it('clamps and restores brightness and audio without allowing a black screen', () => {
    const settings = TestBed.inject(SettingsService);
    settings.setBrightness(0);
    settings.setVolume(.4);
    settings.audioMuted.set(true);
    expect(settings.brightness()).toBe(.2);
    expect(settings.effectiveVolume()).toBe(0);
    TestBed.tick();
    TestBed.resetTestingModule();
    const restored = TestBed.inject(SettingsService);
    expect(restored.brightness()).toBe(.2);
    expect(restored.volume()).toBe(.4);
    expect(restored.audioMuted()).toBe(true);
    restored.audioMuted.set(false);
    expect(restored.effectiveVolume()).toBe(.4);
    restored.setVolume(-1);
    expect(restored.effectiveVolume()).toBe(0);
    restored.setBrightness(NaN);
    expect(restored.brightness()).toBe(.2);
    restored.setBrightness(2);
    expect(restored.brightness()).toBe(1);
  });

  it('clamps invalid stored brightness on startup', () => {
    localStorage.setItem('dash.display.brightness', '-100');
    localStorage.setItem('dash.audio.volume', 'NaN');
    const settings = TestBed.inject(SettingsService);
    expect(settings.brightness()).toBe(.2);
    expect(settings.volume()).toBe(1);
  });

  it('remembers when the code rain background is disabled', () => {
    const settings = TestBed.inject(SettingsService);
    expect(settings.matrixRain()).toBe(true);
    settings.matrixRain.set(false);
    TestBed.flushEffects();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SettingsService).matrixRain()).toBe(false);
  });

  it('preserves Mushroom but migrates removed stored themes to Bare Mirror', () => {
    localStorage.setItem('dash.theme.v1', 'mushroom');
    expect(TestBed.inject(SettingsService).theme()).toBe('mushroom');

    TestBed.resetTestingModule();
    localStorage.setItem('dash.theme.v1', 'celestial');
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SettingsService).theme()).toBe('bare');
  });

  it('removes obsolete illumination preferences without clearing other settings', () => {
    const keys = ['dash.bg.on', 'dash.bg.light', 'dash.ring.size', 'dash.ambience.auto'];
    for (const key of keys) localStorage.setItem(key, 'true');
    localStorage.setItem('dash.theme.v1', 'pinkie');
    const settings = TestBed.inject(SettingsService);
    TestBed.flushEffects();
    for (const key of keys) expect(localStorage.getItem(key)).toBeNull();
    expect(settings.theme()).toBe('pinkie');
  });

  it('persists the retro pointer effects preference', () => {
    const settings = TestBed.inject(SettingsService);
    expect(settings.cursorFx()).toBe(false);
    expect(settings.cursorFxMode()).toBe('laser');

    settings.toggleCursorFx();
    TestBed.flushEffects();

    expect(settings.cursorFx()).toBe(true);
    expect(localStorage.getItem('dash.cursor.fx.v2')).toBe('true');
    expect(document.documentElement.dataset['cursorFx']).toBe('on');

    settings.cycleCursorFxMode();
    TestBed.flushEffects();

    expect(settings.cursorFx()).toBe(true);
    expect(settings.cursorFxMode()).toBe('glitter');
    expect(localStorage.getItem('dash.cursor.fx.mode')).toBe('glitter');
    expect(document.documentElement.dataset['cursorFxMode']).toBe('glitter');
  });

  it('does not carry the old always-on cursor preference into the 4K-safe default', () => {
    localStorage.setItem('dash.cursor.fx', 'true');

    expect(TestBed.inject(SettingsService).cursorFx()).toBe(false);
  });
});
