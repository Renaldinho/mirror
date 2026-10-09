/** Bound animated canvas work to a 1080p pixel budget; coordinates stay in CSS pixels. */
export function canvasScale(width: number, height: number, pixelRatio = 1): number {
  if (width <= 0 || height <= 0) return 1;
  return Math.min(pixelRatio, 2, Math.sqrt((1920 * 1080) / (width * height)));
}
