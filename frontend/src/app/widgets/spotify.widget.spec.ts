import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SpotifyWidget } from './spotify.widget';
import { SpotifyService } from './spotify/spotify.service';

describe('Spotify connection messages', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows the playback error and offers sign-in even when collapsed', () => {
    localStorage.clear();
    const spotify = {
      configured: signal(true), authed: signal(true), track: signal(null),
      error: signal('Spotify denied playback access.'), login: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [SpotifyWidget], providers: [{ provide: SpotifyService, useValue: spotify }],
    });
    const fixture = TestBed.createComponent(SpotifyWidget);
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Spotify denied playback access.');
    spotify.authed.set(false);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(spotify.login).toHaveBeenCalledOnce();
  });

  it('renders playback controls as SVG icons in both layouts', () => {
    localStorage.clear();
    const spotify = {
      configured: signal(true), authed: signal(true), error: signal(null),
      track: signal({ title: 'Track', artists: 'Artist', durationMs: 1000, artUrl: '' }),
      paused: signal(true), positionMs: signal(0), volume: signal(.5),
      premiumError: signal(false), hasDevice: signal(false), deviceName: signal(''),
      prev: vi.fn(), next: vi.fn(), togglePlay: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [SpotifyWidget], providers: [{ provide: SpotifyService, useValue: spotify }],
    });
    const fixture = TestBed.createComponent(SpotifyWidget);
    for (const collapsed of [false, true]) {
      fixture.componentRef.setInput('collapsed', collapsed);
      spotify.paused.set(true);
      fixture.detectChanges();
      for (const label of ['Previous', 'Play', 'Next']) {
        expect(fixture.nativeElement.querySelector(`button[aria-label="${label}"] svg path`)).not.toBeNull();
      }
      spotify.paused.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button[aria-label="Pause"] svg path')).not.toBeNull();
    }
  });

  it('keeps disconnect in a separate footer and signs out with no active track', () => {
    localStorage.clear();
    const spotify = {
      configured: signal(true), authed: signal(true), track: signal(null),
      error: signal('Start playing on a Spotify device. This message can wrap onto several lines.'),
      paused: signal(true), positionMs: signal(0), volume: signal(.5),
      premiumError: signal(false), hasDevice: signal(false), deviceName: signal(''),
      logout: vi.fn(), login: vi.fn(),
    };
    spotify.logout.mockImplementation(() => spotify.authed.set(false));
    TestBed.configureTestingModule({
      imports: [SpotifyWidget], providers: [{ provide: SpotifyService, useValue: spotify }],
    });
    const fixture = TestBed.createComponent(SpotifyWidget);
    fixture.nativeElement.style.height = '320px';
    fixture.detectChanges();
    const disconnect = fixture.nativeElement.querySelector('button[aria-label="Disconnect Spotify"]') as HTMLButtonElement;
    const player = fixture.nativeElement.querySelector('.np') as HTMLElement;
    expect(disconnect).not.toBeNull();
    expect(player.contains(disconnect)).toBe(false);
    expect(fixture.nativeElement.querySelector('.expanded').lastElementChild.classList.contains('account-actions')).toBe(true);
    expect(getComputedStyle(player).overflowY).not.toBe('auto');
    expect(getComputedStyle(fixture.nativeElement).display).toBe('block');
    disconnect.click();
    fixture.detectChanges();
    expect(spotify.logout).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.logout')).toBeNull();
    expect(fixture.nativeElement.querySelector('.connect button')).not.toBeNull();
  });
});
