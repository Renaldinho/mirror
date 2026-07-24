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
    expect(backdrop.querySelector('svg')).toBeNull();
    expect(backdrop.querySelector('.warm-light')).not.toBeNull();
  });

  it('renders a dedicated motif for every decorative theme', () => {
    const fixture = TestBed.createComponent(Background);
    const settings = TestBed.inject(SettingsService);

    for (const theme of THEME_IDS.filter((id) => id !== 'bare')) {
      settings.setTheme(theme);
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.backdrop') as HTMLElement;
      expect(backdrop.dataset['motif']).toBe(theme);
      expect(backdrop.querySelector('svg')).not.toBeNull();
    }
  });
});
