import {
  AIR_DAMPING,
  BallFetchController,
  BALL_RADIUS,
  MAX_THROW_SPEED,
  STOP_SPEED,
} from './ball-fetch';

const bounds = { width: 800, height: 600, topY: 96, floorY: 536 };
const pet = {
  x: 120,
  y: 536,
  width: 80,
  personality: { speed: 40, sleepiness: .2, playfulness: .5, restfulness: .5 },
};
const pointer = { x: 500, y: 260 };

function thrown(controller: BallFetchController): void {
  controller.reset(pet, bounds);
  controller.beginDrag(1, 220, 300, 0, bounds);
  controller.drag(1, 300, 220, 60, bounds);
  controller.release(1, 380, 180, 120, bounds);
}

describe('BallFetchController', () => {
  it('lets the user reclaim a moving or stopped throw before the pet catches it', () => {
    for (const frames of [0, 360]) {
      const controller = new BallFetchController();
      const distantPet = { ...pet, x: 0 };
      controller.reset(distantPet, bounds);
      controller.beginDrag(1, 400, 300, 0, bounds);
      controller.release(1, 450, 300, 100, bounds);
      for (let frame = 0; frame < frames; frame++) {
        controller.step(1 / 60, bounds, distantPet, pointer);
      }
      expect(controller.ball?.phase).toBe('thrown');
      const x = controller.ball!.x;
      const y = controller.ball!.y;
      expect(controller.beginDrag(2, x, y, 10_000, bounds)).toBe(true);
      expect(controller.ball).toMatchObject({ phase: 'held', vx: 0, vy: 0 });
      expect(controller.beginDrag(3, x, y, 10_010, bounds)).toBe(false);
      // Even a pet standing at the ball must stop fetching once the user holds it.
      expect(controller.step(.1, bounds, { ...pet, x: x - pet.width / 2, y: y + 22 }, pointer)).toBeNull();
      expect(controller.ball?.phase).toBe('held');
      controller.drag(2, x - 20, y, 10_040, bounds);
      expect(controller.release(2, x - 40, y, 10_080, bounds)).toBe(true);
      expect(controller.ball?.phase).toBe('thrown');
      expect(controller.ball!.vx).toBeCloseTo(-500);
    }
  });

  it('keeps a click-only release ready instead of starting a fetch', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 220, 300, 0, bounds);

    expect(controller.release(1, 223, 302, 30, bounds)).toBe(false);
    expect(controller.ball?.phase).toBe('ready');
    expect(controller.active).toBe(false);
  });

  it('preserves the speed and direction of a throw above the old cap', () => {
    const controller = new BallFetchController();
    thrown(controller);

    expect(controller.ball?.phase).toBe('thrown');
    expect(controller.ball!.vx).toBeCloseTo(160 / .12);
    expect(controller.ball!.vy).toBeCloseTo(-120 / .12);
  });

  it('keeps gentle throws proportional and caps only very fast flicks', () => {
    const cases = [
      { distance: 60, milliseconds: 120, speed: 500 },
      { distance: 240, milliseconds: 120, speed: 2000 },
      { distance: 600, milliseconds: 10, speed: MAX_THROW_SPEED },
    ];
    for (const sample of cases) {
      const controller = new BallFetchController();
      controller.reset(pet, bounds);
      controller.beginDrag(1, 100, 300, 0, bounds);
      controller.release(1, 100 + sample.distance, 300, sample.milliseconds, bounds);
      expect(controller.ball!.vx).toBeCloseTo(sample.speed);
      expect(controller.ball!.vy).toBe(0);
      controller.step(.1, bounds, pet, pointer, false);
      expect(controller.ball!.x).toBeGreaterThanOrEqual(BALL_RADIUS);
      expect(controller.ball!.x).toBeLessThanOrEqual(bounds.width - BALL_RADIUS);
    }
  });

  it('has no gravity and damps both velocity axes evenly', () => {
    const controller = new BallFetchController();
    thrown(controller);
    const before = { vx: controller.ball!.vx, vy: controller.ball!.vy };
    const ratio = before.vy / before.vx;

    // Measure free flight before the stronger throw reaches a wall.
    controller.step(.04, bounds, { ...pet, x: 0, y: bounds.floorY }, pointer);

    expect(controller.ball!.vy / controller.ball!.vx).toBeCloseTo(ratio, 4);
    expect(Math.hypot(controller.ball!.vx, controller.ball!.vy))
      .toBeCloseTo(Math.hypot(before.vx, before.vy) * Math.exp(-AIR_DAMPING * .04), 3);
  });

  it('rebounds from every edge of the reachable pet area', () => {
    const cases = [
      { start: [20, 300], end: [0, 300], axis: 'vx', sign: 1 },
      { start: [780, 300], end: [800, 300], axis: 'vx', sign: -1 },
      { start: [400, 120], end: [400, 80], axis: 'vy', sign: 1 },
      { start: [400, 510], end: [400, 550], axis: 'vy', sign: -1 },
    ] as const;

    for (const test of cases) {
      const controller = new BallFetchController();
      controller.reset({ ...pet, x: 700 }, bounds);
      controller.beginDrag(1, test.start[0], test.start[1], 0, bounds);
      controller.release(1, test.end[0], test.end[1], 50, bounds);
      controller.step(.08, bounds, { ...pet, x: 700 }, pointer);
      expect(Math.sign(controller.ball![test.axis])).toBe(test.sign);
      expect(controller.ball!.y).toBeGreaterThanOrEqual(bounds.topY + BALL_RADIUS);
      expect(controller.ball!.y).toBeLessThanOrEqual(bounds.floorY - BALL_RADIUS);
    }
  });

  it('slows to a complete stop at an arbitrary two-dimensional position', () => {
    const controller = new BallFetchController();
    thrown(controller);
    const distantPet = { ...pet, x: 0, y: bounds.floorY };

    for (let i = 0; i < 360; i++) controller.step(1 / 60, bounds, distantPet, pointer);

    expect(Math.hypot(controller.ball!.vx, controller.ball!.vy)).toBeLessThanOrEqual(STOP_SPEED);
    expect(controller.ball!.vx).toBe(0);
    expect(controller.ball!.vy).toBe(0);
    expect(controller.ball!.y).toBeGreaterThan(bounds.topY + BALL_RADIUS);
    expect(controller.ball!.y).toBeLessThan(bounds.floorY - BALL_RADIUS);
  });

  it('allows a pet to catch the ball before any wall contact', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 300, 300, 0, bounds);
    controller.release(1, 310, 300, 80, bounds);
    const nearbyPet = { ...pet, x: 270, y: 322 };

    controller.step(1 / 60, bounds, nearbyPet, pointer);

    expect(controller.ball?.phase).toBe('pickup');
  });

  it('runs pickup, carry, delivery, and returns the ball beside the cursor', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 160, 400, 0, bounds);
    controller.release(1, 170, 400, 100, bounds);
    const nearbyPet = { ...pet, x: 130, y: 422 };
    controller.step(1 / 60, bounds, nearbyPet, pointer);
    expect(controller.ball?.phase).toBe('pickup');

    for (let i = 0; i < 50; i++) controller.step(1 / 60, bounds, nearbyPet, pointer);
    expect(controller.ball?.phase).toBe('carried');

    const atPointer = { ...nearbyPet, x: pointer.x - nearbyPet.width / 2, y: pointer.y + 22 };
    controller.step(1 / 60, bounds, atPointer, pointer);
    expect(controller.ball?.phase).toBe('delivery');

    for (let i = 0; i < 50; i++) controller.step(1 / 60, bounds, atPointer, pointer);
    expect(controller.ball?.phase).toBe('ready');
    expect(Math.abs(controller.ball!.x - pointer.x)).toBe(BALL_RADIUS + 16);
    expect(controller.ball!.y).toBe(pointer.y);
  });

  it('cancels a held ball safely', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(7, 220, 300, 0, bounds);
    controller.cancelDrag(7);

    expect(controller.ball?.phase).toBe('ready');
    expect(controller.active).toBe(false);
  });

  it('lets non-fetching companions ignore a throw and leaves the stopped ball reusable', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 160, 400, 0, bounds);
    controller.release(1, 170, 400, 100, bounds);

    const intents = [];
    for (let i = 0; i < 360 && controller.ball?.phase !== 'ready'; i++) {
      intents.push(controller.step(1 / 60, bounds, pet, pointer, false));
    }

    expect(intents.every((intent) => intent === null)).toBe(true);
    expect(controller.ball?.phase).toBe('ready');
    expect(controller.visible).toBe(true);
    expect(controller.active).toBe(false);
  });
});
