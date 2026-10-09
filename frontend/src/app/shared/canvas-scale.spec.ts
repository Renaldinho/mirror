import { canvasScale } from './canvas-scale';

describe('animated canvas pixel budget', () => {
  it('caps landscape, portrait and high DPI canvases without downscaling small displays', () => {
    for (const [width, height, ratio] of [
      [3840, 2160, 1], [2160, 3840, 1], [1920, 1080, 2], [800, 600, 2],
    ]) {
      const scale = canvasScale(width, height, ratio);
      expect(Math.floor(width * scale) * Math.floor(height * scale)).toBeLessThanOrEqual(1920 * 1080);
    }
    expect(canvasScale(3840, 2160)).toBe(0.5);
    expect(canvasScale(1280, 720)).toBe(1);
    expect(canvasScale(800, 600, 2)).toBe(2);
    expect(canvasScale(0, 0)).toBe(1);
  });
});
