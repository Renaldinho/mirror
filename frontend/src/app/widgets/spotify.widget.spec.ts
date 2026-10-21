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
});
