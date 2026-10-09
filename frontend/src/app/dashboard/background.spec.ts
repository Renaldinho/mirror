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

  it('renders the code rain and reflects the matrixRain setting', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-digital-rain')).not.toBeNull();

    settings.matrixRain.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-digital-rain')).toBeNull();
  });

  it('stays visually identical across every widget theme', () => {
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
});
