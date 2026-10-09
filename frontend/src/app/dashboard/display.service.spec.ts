import { TestBed } from '@angular/core/testing';
import { DisplayService } from './display.service';

describe('Portrait display layout', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('responds to rotating the display while the mirror is running', () => {
    const display = TestBed.inject(DisplayService);
    const original = { width: window.innerWidth, height: window.innerHeight };
    try {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1080 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1920 });
      window.dispatchEvent(new Event('resize'));
      expect(display.portrait()).toBe(true);
      expect(display.columns()).toBe(2);
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
      window.dispatchEvent(new Event('resize'));
      expect(display.portrait()).toBe(false);
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: original.width });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: original.height });
    }
  });

  for (const [width, height] of [[720, 1280], [1080, 1920], [2160, 3840]]) {
    it(`fits all six widgets between controls and pet floor at ${width} x ${height}`, () => {
      const display = TestBed.inject(DisplayService);
      display.viewport.set({ width, height });
      const cell = display.cellSize(6);
      const gap = Math.max(16, Math.min(32, width * 0.03));
      const floor = Math.max(120, Math.min(220, height * 0.1));
      expect(cell.width * 2 + gap).toBeCloseTo(width * 0.9);
      expect(cell.height * 3 + gap * 2 + floor + 120).toBeLessThanOrEqual(height + 0.01);
    });
  }

  it('keeps narrow-screen widgets readable in a scrolling single column', () => {
    const display = TestBed.inject(DisplayService);
    display.viewport.set({ width: 390, height: 844 });
    expect(display.columns()).toBe(1);
    expect(display.cellSize(6).height).toBe(360);
    expect(display.cellSize(0).height).toBeGreaterThan(0);
  });
});
