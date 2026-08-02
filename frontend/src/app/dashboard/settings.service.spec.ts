import { TestBed } from '@angular/core/testing';
import { LIGHTING_LEVELS, SettingsService } from './settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-cursor-fx');
    TestBed.configureTestingModule({});
  });

  it('defaults to Bare Mirror with soft warm lighting', () => {
    const settings = TestBed.inject(SettingsService);

    expect(settings.theme()).toBe('bare');
    expect(settings.bgOn()).toBe(true);
    expect(settings.bgLight()).toBe(LIGHTING_LEVELS.soft);
  });

  it('preserves Mushroom but migrates removed stored themes to Bare Mirror', () => {
    localStorage.setItem('dash.theme.v1', 'mushroom');
    expect(TestBed.inject(SettingsService).theme()).toBe('mushroom');

    TestBed.resetTestingModule();
    localStorage.setItem('dash.theme.v1', 'celestial');
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SettingsService).theme()).toBe('bare');
  });

  it('applies Off, Soft, and Bright without coupling them to the theme', () => {
    const settings = TestBed.inject(SettingsService);
    settings.setTheme('pinkie');

    settings.setLightingPreset('off');
    expect(settings.bgOn()).toBe(false);

    settings.setLightingPreset('bright');
    expect(settings.bgOn()).toBe(true);
    expect(settings.bgLight()).toBe(LIGHTING_LEVELS.bright);

    settings.setLightingPreset('soft');
    expect(settings.bgLight()).toBe(LIGHTING_LEVELS.soft);
    expect(settings.theme()).toBe('pinkie');
  });

  it('clamps manual lighting to the supported range', () => {
    const settings = TestBed.inject(SettingsService);

    settings.setLight(-20);
    expect(settings.bgLight()).toBe(0);

    settings.setLight(140);
    expect(settings.bgLight()).toBe(100);

    settings.setLight(Number.NaN);
    expect(settings.bgLight()).toBe(LIGHTING_LEVELS.soft);
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
