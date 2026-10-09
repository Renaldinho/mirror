import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DigitalRain } from './digital-rain';
import { GamesService } from '../minigames/games.service';

describe('cinematic code rain', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal('innerWidth', 3840);
    vi.stubGlobal('innerHeight', 2160);
    TestBed.configureTestingModule({ imports: [DigitalRain] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('caches glyphs and jokes, caps work, and pauses while hidden or playing', () => {
    const motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', vi.fn(() => motion));
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    vi.spyOn(performance, 'now').mockReturnValue(4000);
    const context = { fillText: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const fixture = TestBed.createComponent(DigitalRain);
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    expect([canvas.width, canvas.height]).toEqual([640, 360]);
    expect(context.fillText).toHaveBeenCalledWith('> THERE IS NO SPOON. TRY A FORK.', 0, 20);
    const cachedGlyphs = context.fillText.mock.calls.length;
    context.clearRect.mockClear();
    vi.advanceTimersByTime(1000);
    expect(context.clearRect.mock.calls.length).toBeGreaterThanOrEqual(11);
    expect(context.clearRect.mock.calls.length).toBeLessThanOrEqual(12);
    expect(context.fillText).toHaveBeenCalledTimes(cachedGlyphs);

    vi.stubGlobal('innerWidth', 2160);
    vi.stubGlobal('innerHeight', 3840);
    window.dispatchEvent(new Event('resize'));
    expect([canvas.width, canvas.height]).toEqual([360, 640]);
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    context.clearRect.mockClear();
    vi.advanceTimersByTime(1000);
    expect(context.clearRect).not.toHaveBeenCalled();
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(100);
    expect(context.clearRect).toHaveBeenCalled();

    TestBed.inject(GamesService).open('whack');
    fixture.detectChanges();
    context.clearRect.mockClear();
    vi.advanceTimersByTime(1000);
    expect(context.clearRect).not.toHaveBeenCalled();
    TestBed.inject(GamesService).close();
    fixture.detectChanges();
    fixture.destroy();
    context.clearRect.mockClear();
    vi.advanceTimersByTime(1000);
    expect(context.clearRect).not.toHaveBeenCalled();
    expect(motion.removeEventListener).toHaveBeenCalled();
  });

  it('shows static code when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const context = { fillText: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const fixture = TestBed.createComponent(DigitalRain);
    fixture.detectChanges();
    expect(context.drawImage).toHaveBeenCalled();
    context.clearRect.mockClear();
    vi.advanceTimersByTime(1000);
    expect(context.clearRect).not.toHaveBeenCalled();
  });
});
