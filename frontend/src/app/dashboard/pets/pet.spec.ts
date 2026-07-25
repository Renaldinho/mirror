import { vi } from 'vitest';
import { BlueKitPet } from './blue-kit';
import { CapyPet } from './capy';
import { ColliePet } from './collie';
import { DiplodocusPet } from './diplodocus';
import { FrogPet } from './frog';
import { GingerPet } from './ginger';
import { createPet, PET_CATALOG } from './index';
import { PigeonPet } from './pigeon';
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
  it('registers every companion in both the picker catalog and factory', () => {
    expect(PET_CATALOG.map((pet) => pet.id)).toEqual([
      'capy',
      'lando',
      'frog',
      'shadow-kit',
      'ginger',
      'blue-kit',
      'diplodocus',
      'pigeon',
    ]);

    for (const info of PET_CATALOG) {
      const pet = createPet(info.id);
      expect(pet?.id).toBe(info.id);
      expect(pet?.view().sprite.sheet).toBe(info.sprite);
    }
  });

  it('makes only the chunky orange cat ignore fetch commands', () => {
    expect(new GingerPet().canFetch).toBe(false);
    expect(PET_CATALOG.filter((info) => createPet(info.id)?.canFetch).map((info) => info.id))
      .toEqual(['capy', 'lando', 'frog', 'shadow-kit', 'blue-kit', 'diplodocus', 'pigeon']);
  });

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
    ['Ginger', () => new GingerPet()],
    ['Blue Kit', () => new BlueKitPet()],
    ['Diplo', () => new DiplodocusPet()],
    ['Pigeon', () => new PigeonPet()],
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

  it('walks to the nearest cozy sleep spot before sleeping', () => {
    const pet = new CapyPet();
    const ctx = context({
      dt: .1,
      cozy: {
        items: [],
        sleepSpots: [
          { itemId: 'far', x: 800, y: 240 },
          { itemId: 'near', x: 240, y: 520 },
        ],
        watchSpots: [],
        foodSpots: [],
      },
    });
    pet.update(ctx);
    pet.setState(pet.newSleep(), ctx);

    expect(pet.stateName).toBe('walk');
    for (let i = 0; i < 80 && pet.stateName === 'walk'; i++) pet.update(ctx);

    expect(pet.stateName).toBe('sleep');
    expect(pet.x + pet.width / 2).toBeCloseTo(240, 0);
    expect(pet.y).toBeCloseTo(520, 0);
  });

  it('snaps directly into sleep when dropped onto a cozy anchor', () => {
    const pet = new CapyPet();
    pet.update(context());

    pet.settleToSleep({ itemId: 'bed', x: 420, y: 360 });

    expect(pet.stateName).toBe('sleep');
    expect(pet.x + pet.width / 2).toBe(420);
    expect(pet.y).toBe(360);
  });

  it('walks to an enabled TV and leaves when it is turned off', () => {
    const pet = new CapyPet();
    const watchSpot = { itemId: 'tv', x: 360, y: 420, faceX: 360, faceY: 260 };
    const ctx = context({
      dt: .1,
      cozy: { items: [], sleepSpots: [], watchSpots: [watchSpot], foodSpots: [] },
    });
    pet.update(ctx);
    pet.setState(pet.newWatch(), ctx);

    for (let i = 0; i < 130 && pet.stateName === 'walk'; i++) pet.update(ctx);
    expect(pet.stateName).toBe('curious');
    expect(pet.direction).toBe('up');

    pet.update(context({
      cozy: { items: [], sleepSpots: [], watchSpots: [], foodSpots: [] },
    }));
    expect(pet.stateName).toBe('rest');
  });
});
