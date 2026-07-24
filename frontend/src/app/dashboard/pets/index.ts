import { CapyPet } from './capy';
import { ColliePet } from './collie';
import { FrogPet } from './frog';
import { Pet } from './pet';
import {
  CAPY_SPRITE,
  COLLIE_SPRITE,
  FROG_SPRITE,
  SHADOW_CAT_SPRITE,
} from './pet-sprites';
import { PetSpriteSheet } from './pet-types';
import { ShadowCatPet } from './shadow-cat';

/** Picker metadata shared with the selection service. */
export interface PetInfo {
  id: string;
  label: string;
  description: string;
  sprite: PetSpriteSheet;
}

const REGISTRY: Record<string, () => Pet> = {
  capy: () => new CapyPet(),
  lando: () => new ColliePet(),
  frog: () => new FrogPet(),
  'shadow-kit': () => new ShadowCatPet(),
};

/** Only companions backed by a supplied pet folder belong in this catalog. */
export const PET_CATALOG: PetInfo[] = [
  {
    id: 'capy',
    label: 'Capy',
    description: 'An emotionally stable capybara with a tiny orange.',
    sprite: CAPY_SPRITE,
  },
  {
    id: 'lando',
    label: 'Lando',
    description: 'A friendly black-and-white border collie.',
    sprite: COLLIE_SPRITE,
  },
  {
    id: 'frog',
    label: 'Frog',
    description: 'A cheerful frog companion perched on lily pads.',
    sprite: FROG_SPRITE,
  },
  {
    id: 'shadow-kit',
    label: 'Shadow Kit',
    description: 'A black kitten with amber eyes and a purple collar.',
    sprite: SHADOW_CAT_SPRITE,
  },
];

/** Instantiate a fresh pet for the given folder-backed id. */
export function createPet(id: string): Pet | null {
  return REGISTRY[id]?.() ?? null;
}

export type { Pet } from './pet';
