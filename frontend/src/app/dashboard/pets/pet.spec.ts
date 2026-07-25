import { vi } from 'vitest';
import { CapyPet } from './capy';
import { ColliePet } from './collie';
import { FrogPet } from './frog';
import { ShadowCatPet } from './shadow-cat';
import { PetContext } from './pet-types';

function context(overrides: Partial<PetContext> = {}): PetContext {
  return {
    now: 0,
    dt: .5,
    width: 1000,
    height: 700,
    floorY: 636,
    pointer: { x: 500, y: 300, active: false },
    fetch: null,
    energy: .8,
    dim: false,
    ...overrides,
  };
}

describe('desktop pet actions', () => {
  it('maps each movement direction to its dedicated atlas row', () => {
    const pet = new CapyPet();
    const ctx = context();
    pet.update(ctx);
    pet.setState(pet.newWalk(), ctx);

    pet.setMotionDirection(1, 0);
    expect(pet.view().sprite.row).toBe(1);
    pet.setMotionDirection(-1, 0);
    expect(pet.view().sprite.row).toBe(2);
    pet.setMotionDirection(0, -1);
    expect(pet.view().sprite.row).toBe(3);
    pet.setMotionDirection(0, 1);
    expect(pet.view().sprite.row).toBe(4);
  });

  it('wanders upward as well as sideways', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const pet = new CapyPet();
    const ctx = context({ dt: 1 });
    pet.update(ctx);
    pet.setState(pet.newWalk(), ctx);
    const startY = pet.y;

    pet.update(ctx);

    expect(pet.y).toBeLessThan(startY);
    expect(pet.direction).toBe('up');
    random.mockRestore();
  });

  it('stops to eat and uses the dedicated food row', () => {
    const pet = new CapyPet();
    const ctx = context();
    pet.update(ctx);

    pet.feed();

    expect(pet.stateName).toBe('eat');
    expect(pet.view().sprite.row).toBe(6);
  });

  it('uses the dedicated curled-up sleep row', () => {
    const pet = new CapyPet();
    const ctx = context();
    pet.update(ctx);
    pet.setState(pet.newSleep(), ctx);

    expect(pet.view().sprite.row).toBe(5);
  });

  it('plays through both rows of the extended eight-frame play cycle', () => {
    const pet = new CapyPet();
    const ctx = context({ dt: .8 });
    pet.update(ctx);
    pet.setState(pet.newPlay(), ctx);

    expect(pet.view().sprite.row).toBe(10);
    pet.update(ctx);

    expect(pet.view().sprite.row).toBe(11);
    expect(pet.view().sprite.column).toBe(0);
  });

  it('maps the complete fetch lifecycle to its dedicated atlas rows', () => {
    const pet = new CapyPet();
    const ctx = context();
    pet.update(ctx);

    pet.update(context({ fetch: { mode: 'chase', targetX: 500, targetY: 400, speed: 180 } }));
    expect(pet.stateName).toBe('fetch');
    expect(pet.view().sprite.row).toBeGreaterThanOrEqual(1);
    expect(pet.view().sprite.row).toBeLessThanOrEqual(4);

    pet.update(context({ fetch: { mode: 'pickup' } }));
    expect(pet.view().sprite.row).toBe(14);

    pet.update(context({ fetch: { mode: 'carry', targetX: 700, targetY: 400, speed: 180 } }));
    pet.setMotionDirection(-1, 0);
    expect(pet.view().sprite.row).toBe(16);

    pet.update(context({ fetch: { mode: 'deliver' } }));
    expect(pet.view().sprite.row).toBe(19);

    pet.update(context());
    expect(pet.stateName).toBe('rest');
  });

  it.each([
    ['Capy', () => new CapyPet()],
    ['Lando', () => new ColliePet()],
    ['Frog', () => new FrogPet()],
    ['Shadow Kit', () => new ShadowCatPet()],
  ])('provides pickup, directional carry, and delivery art for %s', (_name, makePet) => {
    const pet = makePet();
    pet.update(context({ fetch: { mode: 'pickup' } }));
    expect(pet.view().sprite.row).toBe(14);

    pet.update(context({ fetch: { mode: 'carry', targetX: 700, targetY: 400, speed: 180 } }));
    for (const [dx, dy, row] of [[1, 0, 15], [-1, 0, 16], [0, -1, 17], [0, 1, 18]] as const) {
      pet.setMotionDirection(dx, dy);
      expect(pet.view().sprite.row).toBe(row);
    }

    pet.update(context({ fetch: { mode: 'deliver' } }));
    expect(pet.view().sprite.row).toBe(19);
  });

  it('queues feeding until an active fetch completes', () => {
    const pet = new CapyPet();
    pet.update(context({ fetch: { mode: 'pickup' } }));

    pet.feed();
    expect(pet.stateName).toBe('pickup');

    pet.update(context());
    expect(pet.stateName).toBe('eat');
  });
});
