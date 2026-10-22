import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PetService } from '../../dashboard/pet.service';
import { AlarmService } from '../../widgets/alarm.service';
import { AudioFx } from '../audio';
import { GamesService } from '../games.service';
import { Pong } from './pong';

describe('Pong controls and rendering', () => {
  let rect: { left: number; top: number; width: number; height: number };
  let resize: () => void;
  const alarm = { ringing: signal(false) };
  const audio = { play: vi.fn() };

  beforeEach(() => {
    localStorage.clear();
    alarm.ringing.set(false);
    rect = { left: 0, top: 0, width: 1000, height: 600 };
    vi.spyOn(SVGSVGElement.prototype, 'getBoundingClientRect').mockImplementation(() => rect as DOMRect);
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resize = callback; }
      observe() {} disconnect() {}
    });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    TestBed.configureTestingModule({ imports: [Pong], providers: [
      { provide: AudioFx, useValue: audio },
      { provide: AlarmService, useValue: alarm },
      { provide: PetService, useValue: { kind: signal(null), activeName: signal('Lando') } },
    ] });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); audio.play.mockClear(); });

  it('starts only on request, pauses for alarms and focus loss, and cancels animation on close', () => {
    const fixture = TestBed.createComponent(Pong);
    fixture.detectChanges();
    const game = fixture.componentInstance;
    expect(game.phase()).toBe('setup');
    expect(fixture.nativeElement.textContent).toContain('Lando');
    expect(game['frame']).toBe(0);
    fixture.nativeElement.querySelector('.primary').click();
    fixture.detectChanges();
    expect(game.phase()).toBe('play');
    game['animate'](100); game['animate'](200);
    game.blur();
    expect(game.phase()).toBe('paused');
    game.resume();
    alarm.ringing.set(true);
    fixture.detectChanges();
    expect(game.phase()).toBe('paused');
    game.resume();
    expect(game.phase()).toBe('paused');
    fixture.destroy();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('maps letterboxed pointer input in landscape and rotates controls in portrait', () => {
    const fixture = TestBed.createComponent(Pong);
    fixture.detectChanges();
    const game = fixture.componentInstance;
    game.start();
    rect = { left: 0, top: 0, width: 1200, height: 600 };
    resize();
    game.point({ clientX: 600, clientY: 400 } as PointerEvent);
    game['animate'](100); game['animate'](150);
    expect(game.model.playerY).toBeGreaterThan(300);

    rect = { left: 50, top: 30, width: 600, height: 1200 };
    resize();
    fixture.detectChanges();
    expect(game.portrait()).toBe(true);
    expect(fixture.nativeElement.querySelector('svg.court').getAttribute('viewBox')).toBe('0 0 600 1000');
    game.point({ clientX: 150, clientY: 500 } as PointerEvent);
    game['animate'](200); game['animate'](250);
    expect(game.model.playerY).toBeLessThan(300);
    game.keyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const before = game.model.playerY;
    game['animate'](300);
    expect(game.model.playerY).toBeGreaterThan(before);
  });

  it('opens correctly when the display is already portrait', () => {
    rect = { left: 0, top: 0, width: 600, height: 1000 };
    const fixture = TestBed.createComponent(Pong);
    fixture.detectChanges();
    expect(fixture.componentInstance.portrait()).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg.court').getAttribute('viewBox')).toBe('0 0 600 1000');
  });

  it('saves difficulty and rally records and offers another match after a win', () => {
    const fixture = TestBed.createComponent(Pong);
    fixture.detectChanges();
    const game = fixture.componentInstance;
    game.selectDifficulty('hard');
    game.start();
    expect(localStorage.getItem('dash.pong.difficulty')).toBe('hard');
    game.model.playerScore = 7;
    game.model.bestRally = 12;
    game['handleCue']('win');
    fixture.detectChanges();
    expect(game.phase()).toBe('over');
    expect(TestBed.inject(GamesService).highScore('pong')).toBe(12);
    expect(fixture.nativeElement.textContent).toContain('You win!');
    expect(fixture.nativeElement.querySelector('.primary').textContent).toContain('Play again');
    game.start();
    expect(game.playerScore()).toBe(0);
    expect(game.aiScore()).toBe(0);
    expect(game.model.mode).toBeDefined();
    expect(game.phase()).toBe('play');
  });
});
