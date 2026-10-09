import { TestBed } from '@angular/core/testing';
import { Background } from './background';
import { SettingsService } from './settings.service';
import { THEME_IDS } from './theme-registry';
import { vi } from 'vitest';

describe('Mirror background', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    TestBed.configureTestingModule({ imports: [Background] });
  });

  afterEach(() => vi.restoreAllMocks());

  it('exposes a dedicated code rain toggle', () => {
    const fixture = TestBed.createComponent(Background);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.matrix-toggle') as HTMLButtonElement;
    expect(button.textContent).toContain('Code rain');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('app-digital-rain')).not.toBeNull();
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('app-digital-rain')).toBeNull();
  });

  it('keeps the same background controls across every widget theme', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);
    fixture.detectChanges();
    const initial = fixture.nativeElement.innerHTML;

    for (const theme of THEME_IDS) {
      settings.setTheme(theme);
      fixture.detectChanges();
      expect(fixture.nativeElement.innerHTML).toBe(initial);
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
    }
  });

  it('keeps pointer controls accessible independently of code rain', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector('.pointer-fx') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    fixture.nativeElement.querySelector('.pointer-style').click();
    fixture.detectChanges();
    expect(settings.cursorFxMode()).toBe('glitter');
    expect(settings.matrixRain()).toBe(true);
  });
});
