import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AudioFx } from '../audio';
import { DuckHunt } from './duck-hunt';

describe('Duck Hunt difficulty', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [DuckHunt],
      providers: [{ provide: AudioFx, useValue: { play: vi.fn() } }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a cursor on menus and hides it only when the crosshair is active', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const fixture = TestBed.createComponent(DuckHunt);
    const game = fixture.componentInstance;
    game.assetsReady.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.style.cursor).toBe('auto');
    expect(fixture.nativeElement.querySelectorAll('.difficulties button')).toHaveLength(3);
    game.restart();
    fixture.detectChanges();
    expect(fixture.nativeElement.style.cursor).toBe('none');
    game['gameOver']();
    fixture.detectChanges();
    expect(fixture.nativeElement.style.cursor).toBe('auto');
    expect(fixture.nativeElement.querySelector('.over').textContent).toContain('Play again');
  });

  it('waits for Start, remembers difficulty, and caps Easy as rounds progress', () => {
    const game = TestBed.createComponent(DuckHunt).componentInstance;
    expect(game.phase()).toBe('setup');
    expect(game.difficulty()).toBe('easy');
    game.assetsReady.set(true);
    game['update'](1);
    expect(game.phase()).toBe('setup');
    game.selectDifficulty('normal');
    expect(TestBed.createComponent(DuckHunt).componentInstance.difficulty()).toBe('normal');
    game.selectDifficulty('easy');
    game.restart();
    expect(game.phase()).toBe('ready');
    game['update'](1.5);
    expect(game.phase()).toBe('round');
    game.round.set(99);
    game['elapsed'] = 1000;
    expect(game['speed']()).toBe(100);
    expect(game['concurrent']()).toBe(1);
    expect(game['hitRadius']()).toBe(56);
    game.games.gameCursorSuppressed.set(true);
    game['gameOver']();
    expect(game.games.gameCursorSuppressed()).toBe(false);
    expect(game.phase()).toBe('gameover');
  });

  it('gives Easy more time and accepts controller shots outside the Hard hit area', () => {
    const game = TestBed.createComponent(DuckHunt).componentInstance;
    game.assetsReady.set(true);
    game['w'] = 1000;
    game['h'] = 700;
    game['aim'].setBounds(1000, 700);
    game.restart();
    game.phase.set('round');
    const duck = { x: 400, y: 300, vx: 0, vy: 0, phase: 'fly' as const, t: 4.3 };
    game['ducks'] = [duck];
    game['updateDuck'](duck, .016);
    expect(duck.phase).toBe('fly');
    game['aim'].setRawPointer(445, 300);
    game['shoot']();
    expect(duck.phase).toBe('hit');
    expect(game.score()).toBeGreaterThan(0);
    game.selectDifficulty('hard');
    game.restart();
    game.phase.set('round');
    const hardDuck = { ...duck, phase: 'fly' as const, t: 4.3 };
    game['updateDuck'](hardDuck, .016);
    expect(hardDuck.phase).toBe('flee');
    expect(game.misses()).toBe(1);
    expect(game['hitRadius']()).toBe(26);
  });
});
