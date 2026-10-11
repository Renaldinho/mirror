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
});
