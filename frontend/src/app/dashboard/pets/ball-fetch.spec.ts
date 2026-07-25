import { BallFetchController, BALL_RADIUS, MAX_THROW_SPEED } from './ball-fetch';

const bounds = { width: 800, height: 600, floorY: 536 };
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
  it('keeps a click-only release ready instead of starting a fetch', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 220, 300, 0, bounds);

    expect(controller.release(1, 223, 302, 30, bounds)).toBe(false);
    expect(controller.ball?.phase).toBe('ready');
    expect(controller.active).toBe(false);
  });

  it('derives and clamps throw velocity from recent pointer movement', () => {
    const controller = new BallFetchController();
    thrown(controller);

    expect(controller.ball?.phase).toBe('thrown');
    expect(Math.hypot(controller.ball!.vx, controller.ball!.vy)).toBeCloseTo(MAX_THROW_SPEED);
  });

  it('rebounds from screen bounds and never escapes the play area', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 300, 200, 0, bounds);
    controller.drag(1, 760, 190, 100, bounds);
    controller.release(1, 790, 190, 120, bounds);

    for (let i = 0; i < 90; i++) controller.step(1 / 60, bounds, pet, pointer);

    expect(controller.ball!.x).toBeGreaterThanOrEqual(BALL_RADIUS);
    expect(controller.ball!.x).toBeLessThanOrEqual(bounds.width - BALL_RADIUS);
    expect(controller.ball!.y).toBeLessThanOrEqual(bounds.floorY - BALL_RADIUS);
    expect(controller.ball!.hasBounced).toBe(true);
  });

  it('chases immediately but cannot pick up before the first bounce', () => {
    const controller = new BallFetchController();
    controller.reset(pet, bounds);
    controller.beginDrag(1, 160, 500, 0, bounds);
    controller.release(1, 166, 490, 30, bounds);

    const intent = controller.step(1 / 60, bounds, pet, pointer);

    expect(intent?.mode).toBe('chase');
    expect(controller.ball?.phase).toBe('thrown');
  });

  it('runs pickup, carry, delivery, and returns the ball beside the cursor', () => {
    const controller = new BallFetchController();
    const nearbyPet = { ...pet, x: 120, y: bounds.floorY };
    controller.reset(nearbyPet, bounds);
    controller.beginDrag(1, 160, 480, 0, bounds);
    controller.release(1, 170, bounds.floorY - BALL_RADIUS, 100, bounds);

    for (let i = 0; i < 90 && controller.ball?.phase === 'thrown'; i++) {
      controller.step(1 / 60, bounds, nearbyPet, pointer);
    }
    expect(controller.ball?.phase).toBe('pickup');
    expect(controller.visible).toBe(false);

    for (let i = 0; i < 50; i++) controller.step(1 / 60, bounds, nearbyPet, pointer);
    expect(controller.ball?.phase).toBe('carried');
    expect(controller.step(0, bounds, nearbyPet, pointer)?.mode).toBe('carry');

    const atPointer = { ...nearbyPet, x: pointer.x - nearbyPet.width / 2, y: pointer.y + 22 };
    controller.step(1 / 60, bounds, atPointer, pointer);
    expect(controller.ball?.phase).toBe('delivery');

    for (let i = 0; i < 50; i++) controller.step(1 / 60, bounds, atPointer, pointer);
    expect(controller.ball?.phase).toBe('ready');
    expect(controller.visible).toBe(true);
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
});
