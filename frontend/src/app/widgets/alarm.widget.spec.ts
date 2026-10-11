import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DashboardService } from '../dashboard/dashboard.service';
import { AlarmService } from './alarm.service';
import { AlarmWidget } from './alarm.widget';
import { AlarmPopup } from './alarm-popup';

describe('alarm widget and popup', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('steps the time, shows the ringtone and previews a dismissible face popup', () => {
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    TestBed.inject(DashboardService).add('alarm');
    const widget = TestBed.createComponent(AlarmWidget);
    const popup = TestBed.createComponent(AlarmPopup);
    widget.detectChanges();
    popup.detectChanges();

    const alarm = TestBed.inject(AlarmService);
    expect(alarm.settings().time).toBe('07:00');
    (widget.nativeElement.querySelector('button[aria-label="Hour up"]') as HTMLButtonElement).click();
    widget.detectChanges();
    expect(alarm.settings().time).toBe('08:00');
    (widget.nativeElement.querySelector('button[aria-label="Minute down"]') as HTMLButtonElement).click();
    widget.detectChanges();
    expect(alarm.settings().time).toBe('08:59');

    const picker = widget.nativeElement.querySelector('#alarm-ringtone') as HTMLSelectElement;
    expect(picker.options.length).toBe(4);
    expect(picker.options[0].textContent).toContain('Petah Gryffin');
    expect(picker.options[1].textContent).toContain('Imperial Star Destroyer');
    expect(picker.options[2].textContent).toContain('Faaaah');
    expect(picker.options[3].textContent).toContain('Good Morning Pineapple');
    expect(picker.value).toBe('petah-gryffin');

    widget.nativeElement.querySelector('.preview').click();
    popup.detectChanges();
    expect(popup.nativeElement.querySelector('[role=dialog]')).not.toBeNull();
    expect(popup.nativeElement.querySelector('img').getAttribute('src')).toBe('/alarms/peter-low-quality.jpg');
    popup.nativeElement.querySelector('.stop').click();
    popup.detectChanges();
    expect(popup.nativeElement.querySelector('[role=dialog]')).toBeNull();

    // Switching ringtone swaps the popup face and the looping sound.
    picker.value = 'star-destroyer';
    picker.dispatchEvent(new Event('change'));
    widget.detectChanges();
    expect(alarm.settings().ringtone).toBe('star-destroyer');
    widget.nativeElement.querySelector('.preview').click();
    popup.detectChanges();
    expect(popup.nativeElement.querySelector('img').getAttribute('src')).toBe('/alarms/star-destroyer.png');
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock.instances.at(-1) as HTMLAudioElement;
    expect(audio.src).toContain('/alarms/star-destroyer-7ejH_BihwFQ.m4a');
    popup.nativeElement.querySelector('.stop').click();

    picker.value = 'faaaah';
    picker.dispatchEvent(new Event('change'));
    widget.detectChanges();
    expect(alarm.settings().ringtone).toBe('faaaah');
    widget.nativeElement.querySelector('.preview').click();
    popup.detectChanges();
    expect(popup.nativeElement.querySelector('img').getAttribute('src')).toBe('/alarms/faaaah-squirrel-tenor.png');
    const fahAudio = vi.mocked(HTMLMediaElement.prototype.play).mock.instances.at(-1) as HTMLAudioElement;
    expect(fahAudio.src).toContain('/alarms/faaaah-0ohfbAPupk0.m4a');
    expect(fahAudio.loop).toBe(true);
    popup.nativeElement.querySelector('.stop').click();

    picker.value = 'good-morning-pineapple';
    picker.dispatchEvent(new Event('change'));
    widget.detectChanges();
    widget.nativeElement.querySelector('.preview').click();
    popup.detectChanges();
    expect(popup.nativeElement.querySelector('img').getAttribute('src')).toBe('/alarms/good-morning-pineapple.jpg');
    const pineappleAudio = vi.mocked(HTMLMediaElement.prototype.play).mock.instances.at(-1) as HTMLAudioElement;
    expect(pineappleAudio.src).toContain('/alarms/good-morning-pineapple-DHXlkTpT0Vg.m4a');
    expect(pineappleAudio.loop).toBe(true);
    popup.nativeElement.querySelector('.stop').click();
  });
});
