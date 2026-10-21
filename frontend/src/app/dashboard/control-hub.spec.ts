import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ControlHub } from './control-hub';
import { SettingsService } from './settings.service';
import { DashboardService } from './dashboard.service';

describe('ControlHub', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    TestBed.configureTestingModule({ imports: [ControlHub] });
  });

  afterEach(() => vi.restoreAllMocks());

  function open(fixture: ReturnType<typeof TestBed.createComponent<ControlHub>>, section: string): void {
    const hub = fixture.componentInstance;
    hub.menuOpen.set(true);
    hub.openSection(section as never);
    fixture.detectChanges();
  }

  it('fans the petals open and closes on the hub toggle', () => {
    const fixture = TestBed.createComponent(ControlHub);
    const hub = fixture.componentInstance;
    fixture.detectChanges();

    expect(hub.menuOpen()).toBe(false);
    hub.toggleMenu();
    fixture.detectChanges();
    expect(hub.menuOpen()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.petal').length).toBe(5);

    hub.openSection('theme');
    hub.toggleMenu();
    expect(hub.menuOpen()).toBe(false);
    expect(hub.section()).toBeNull();
  });

  it('toggles the code rain from the effects panel', () => {
    const fixture = TestBed.createComponent(ControlHub);
    const settings = TestBed.inject(SettingsService);
    open(fixture, 'effects');

    const rain = fixture.nativeElement.querySelectorAll('.row')[1] as HTMLButtonElement;
    expect(settings.matrixRain()).toBe(true);
    rain.click();
    expect(settings.matrixRain()).toBe(false);
  });

  it('cycles the cursor FX style from the effects panel', () => {
    const fixture = TestBed.createComponent(ControlHub);
    const settings = TestBed.inject(SettingsService);
    open(fixture, 'effects');

    const fxToggle = fixture.nativeElement.querySelectorAll('.row')[2] as HTMLButtonElement;
    fxToggle.click();
    expect(settings.cursorFx()).toBe(true);

    const style = fixture.nativeElement.querySelectorAll('.row')[3] as HTMLButtonElement;
    style.click();
    expect(settings.cursorFxMode()).toBe('glitter');
  });

  it('toggles a widget from the widgets panel', () => {
    const fixture = TestBed.createComponent(ControlHub);
    const dash = TestBed.inject(DashboardService);
    open(fixture, 'widgets');

    expect(dash.isActive('clock')).toBe(false);
    const firstTile = fixture.nativeElement.querySelector('.tile') as HTMLButtonElement;
    firstTile.click();
    expect(dash.widgets().length).toBe(1);
  });

  it('adjusts volume and brightness from the effects panel and restores volume after mute', () => {
    const fixture = TestBed.createComponent(ControlHub);
    const settings = TestBed.inject(SettingsService);
    open(fixture, 'effects');
    const volume = fixture.nativeElement.querySelector('#mirror-volume') as HTMLInputElement;
    volume.value = '.35';
    volume.dispatchEvent(new Event('input'));
    const mute = fixture.nativeElement.querySelector('.row') as HTMLButtonElement;
    mute.click();
    expect(settings.effectiveVolume()).toBe(0);
    mute.click();
    expect(settings.effectiveVolume()).toBe(.35);
    const brightness = fixture.nativeElement.querySelector('#mirror-brightness') as HTMLInputElement;
    expect(brightness.min).toBe('.2');
    brightness.value = '.2';
    brightness.dispatchEvent(new Event('input'));
    expect(settings.brightness()).toBe(.2);
  });

  it('selects a theme from the theme panel', () => {
    const fixture = TestBed.createComponent(ControlHub);
    const settings = TestBed.inject(SettingsService);
    open(fixture, 'theme');

    const cards = fixture.nativeElement.querySelectorAll('.theme-card') as NodeListOf<HTMLButtonElement>;
    expect(cards.length).toBeGreaterThan(1);
    cards[1].click();
    expect(settings.theme()).not.toBe('bare');
  });
});
