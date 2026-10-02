import { TestBed } from '@angular/core/testing';
import { Background } from './background';
import { SettingsService } from './settings.service';
import { THEME_IDS } from './theme-registry';

describe('Background', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Background] });
  });

  it('keeps Bare Mirror free of decorative SVG artwork', () => {
    const fixture = TestBed.createComponent(Background);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
    expect(backdrop.dataset['motif']).toBe('bare');
    expect(backdrop.querySelector('.theme-art')).toBeNull();
    expect(backdrop.querySelector('.practical-light')).not.toBeNull();
  });

  it('renders a dedicated motif for every decorative theme', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);

    for (const theme of THEME_IDS.filter((id) => id !== 'bare')) {
      settings.setTheme(theme);
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
      const image = backdrop.querySelector('.theme-art') as HTMLImageElement;
      expect(backdrop.dataset['motif']).toBe(theme);
      expect(image).not.toBeNull();
      expect(image.getAttribute('src')).toBe(`/themes/${theme}-v2.png`);
    }
  });

  it('lights dark artwork with theme-aware exposure instead of a generic warm wash', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);
    settings.setTheme('emo');
    settings.setLight(0);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
    const image = backdrop.querySelector('.theme-art') as HTMLImageElement;
    const sceneLight = backdrop.querySelector('.scene-light') as HTMLElement;
    const darkFilter = image.style.filter;
    expect(sceneLight.style.opacity).toBe('0');

    settings.setLight(100);
    fixture.detectChanges();

    expect(image.style.filter).not.toBe(darkFilter);
    expect(image.style.filter).toContain('brightness(1.180)');
    expect(sceneLight.style.opacity).toBe('0.5');
  });
});
