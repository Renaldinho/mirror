import { TestBed } from '@angular/core/testing';
import {
  COZY_STORAGE_KEY,
  LEGACY_HABITAT_STORAGE_KEY,
  PetCozyService,
} from './pet-cozy.service';

const bounds = { width: 800, height: 600, topY: 96, floorY: 536 };

describe('PetCozyService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('freely places overlapping item types but allows only one of each', () => {
    const service = TestBed.inject(PetCozyService);
    service.initialise(bounds);

    expect(service.add(service.preview('bed', 100, 200, bounds), bounds)).toBe(true);
    expect(service.add(service.preview('house', 100, 200, bounds), bounds)).toBe(true);
    expect(service.add(service.preview('bed', 400, 300, bounds), bounds)).toBe(false);
    expect(service.items()).toHaveLength(2);
  });

  it('persists TV state and exposes its viewing anchor only while enabled', () => {
    const service = TestBed.inject(PetCozyService);
    service.initialise(bounds);
    service.add(service.preview('tv', 200, 200, bounds), bounds);

    expect(service.snapshot(bounds).watchSpots).toHaveLength(1);
    service.toggleTv();
    expect(service.snapshot(bounds).watchSpots).toHaveLength(0);
    TestBed.flushEffects();

    const stored = JSON.parse(localStorage.getItem(COZY_STORAGE_KEY)!);
    expect(stored.items.find((item: { type: string }) => item.type === 'tv').enabled).toBe(false);
  });

  it('recognises drop-to-sleep areas and returns their activity anchor', () => {
    const service = TestBed.inject(PetCozyService);
    service.initialise(bounds);
    service.add(service.preview('cushion', 300, 240, bounds), bounds);

    expect(service.sleepSpotAt(330, 260, bounds)).toMatchObject({
      x: 380,
      y: 298,
    });
    expect(service.sleepSpotAt(20, 20, bounds)).toBeNull();
  });

  it('clamps furniture on resize and removes obsolete obstacle storage', () => {
    localStorage.setItem(LEGACY_HABITAT_STORAGE_KEY, '{"version":1}');
    localStorage.setItem(COZY_STORAGE_KEY, JSON.stringify({
      version: 1,
      bounds,
      items: [{ id: 'cozy-bed', type: 'bed', x: 740, y: 500 }],
    }));
    const service = TestBed.inject(PetCozyService);

    service.initialise({ width: 500, height: 400, topY: 84, floorY: 336 });

    expect(service.items()[0].x).toBe(316);
    expect(service.items()[0].y).toBe(184);
    expect(localStorage.getItem(LEGACY_HABITAT_STORAGE_KEY)).toBeNull();
  });
});
