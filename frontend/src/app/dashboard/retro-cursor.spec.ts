import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RetroCursor } from './retro-cursor';
import { SettingsService } from './settings.service';

describe('cursor effects rendering budget', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('bounds the canvas and bursts, throttles work, and stops completely when disabled', () => {
    localStorage.clear();
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(any-pointer: fine)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const context = {
      setTransform: vi.fn(), clearRect: vi.fn(), fillText: vi.fn(),
      beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(performance, 'now').mockReturnValue(0);
    let frame: FrameRequestCallback = () => {};
    const request = vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', request);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const pointer = (type: string, x: number, y: number) =>
      window.dispatchEvent(Object.assign(new Event(type), { clientX: x, clientY: y, pointerType: 'mouse' }));

    TestBed.configureTestingModule({ imports: [RetroCursor] });
    const fixture = TestBed.createComponent(RetroCursor);
    const settings = TestBed.inject(SettingsService);
    fixture.detectChanges();
    request.mockClear();
    pointer('pointerdown', 100, 100);
    expect(request).not.toHaveBeenCalled();

    settings.cursorFxMode.set('glitter');
    settings.cursorFx.set(true);
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    expect([canvas.width, canvas.height]).toEqual([384, 384]);
    const canvasStyle = getComputedStyle(canvas);
    expect(canvasStyle.width).toBe(`${canvas.width}px`);
    expect(canvasStyle.height).toBe(`${canvas.height}px`);
    pointer('pointermove', 100, 100);
    for (let i = 0; i < 20; i++) pointer('pointermove', 120 + i, 100);
    frame(60);
    // High-frequency input produces only one trail particle during this interval.
    expect(context.fillText).toHaveBeenCalledTimes(1);

    context.fillText.mockClear();
    for (let i = 0; i < 10; i++) pointer('pointerdown', 3000, 1800);
    frame(70);
    expect(context.fillText).not.toHaveBeenCalled();
    frame(120);
    expect(context.fillText).toHaveBeenCalledTimes(24);
    expect(context.clearRect).toHaveBeenLastCalledWith(0, 0, 384, 384);
    expect(context.setTransform).toHaveBeenLastCalledWith(1, 0, 0, 1, -2808, -1608);
    expect(canvas.style.transform).toBe('translate3d(2808px, 1608px, 0)');

    settings.cursorFx.set(false);
    fixture.detectChanges();
    expect(cancel).toHaveBeenCalledWith(1);
    const requests = request.mock.calls.length;
    pointer('pointermove', 200, 200);
    pointer('pointerdown', 200, 200);
    expect(request).toHaveBeenCalledTimes(requests);
  });
});
