import { TestBed } from '@angular/core/testing';
import { PiHelp, PiHelpService } from './pi-help';

describe('Pi guide in the kiosk', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PiHelp] }));
  afterEach(() => TestBed.resetTestingModule());

  it('renders the complete embedded guide without HTTP, offers a download, and closes with Escape', () => {
    const help = TestBed.inject(PiHelpService);
    help.open.set(true);
    const fixture = TestBed.createComponent(PiHelp);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('pre').textContent).toContain('ssh renars@raspberrypi.local');
    expect(fixture.nativeElement.querySelector('pre').textContent).toContain('bash deploy/pi/update.sh --force --reboot');
    expect(fixture.nativeElement.querySelector('pre').textContent).toContain('Without a Pi keyboard');
    expect(fixture.nativeElement.querySelector('pre script')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[download]').getAttribute('href')).toBe('/PI-INSTRUCTIONS.txt');
    fixture.nativeElement.querySelector('section').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(help.open()).toBe(false);
  });

  it('stays open while reading and supports the close button', () => {
    const help = TestBed.inject(PiHelpService);
    help.open.set(true);
    const fixture = TestBed.createComponent(PiHelp);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('pre').click();
    expect(help.open()).toBe(true);
    fixture.nativeElement.querySelector('.close').click();
    expect(help.open()).toBe(false);
  });
});
