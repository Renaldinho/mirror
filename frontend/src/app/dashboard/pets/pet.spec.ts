import { vi } from 'vitest';
import { CapyPet } from './capy';
import { PetContext } from './pet-types';

function context(overrides: Partial<PetContext> = {}): PetContext {
  return {
    now: 0,
    dt: .5,
    width: 1000,
    height: 700,
    floorY: 636,
    pointer: { x: 500, y: 300, active: false },
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
});
