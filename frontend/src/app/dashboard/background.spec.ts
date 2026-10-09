import { TestBed } from '@angular/core/testing';
import { Background } from './background';
import { SettingsService } from './settings.service';
import { THEME_IDS } from './theme-registry';

describe('Mirror ring light', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Background] });
  });

  it('keeps the same ring and black mirror surface across every widget theme', () => {
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

  it('dims only the ring and fully hides it at zero or when switched off', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);
    fixture.detectChanges();
    const ring = fixture.nativeElement.querySelector('.ring-light') as HTMLElement;
    for (const level of [0, 40, 100]) {
      settings.setLight(level);
      fixture.detectChanges();
      expect(ring.style.opacity).toBe(String(level / 100));
    }
    settings.toggleBg();
    fixture.detectChanges();
    expect(ring.style.opacity).toBe('0');
    settings.toggleBg();
    fixture.detectChanges();
    expect(ring.style.opacity).toBe('1');
  });

  it('resizes the centered oval without changing its brightness', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);
    settings.setRingSize(65);
    fixture.detectChanges();
    const ring = fixture.nativeElement.querySelector('.ring-light') as HTMLElement;
    expect(ring.style.width).toBe('65%');
    expect(ring.style.height).toBe('65%');
    expect(ring.style.opacity).toBe('0.4');
  });
});
