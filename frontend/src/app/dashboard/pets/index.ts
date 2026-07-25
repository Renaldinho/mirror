import { BlueKitPet } from './blue-kit';
import { CapyPet } from './capy';
import { ColliePet } from './collie';
import { DiplodocusPet } from './diplodocus';
import { FrogPet } from './frog';
import { GingerPet } from './ginger';
import { Pet } from './pet';
import {
  BLUE_KIT_SPRITE,
  CAPY_SPRITE,
  COLLIE_SPRITE,
  DIPLODOCUS_SPRITE,
  FROG_SPRITE,
  GINGER_SPRITE,
  PIGEON_SPRITE,
  SHADOW_CAT_SPRITE,
} from './pet-sprites';
import { PetSpriteSheet } from './pet-types';
import { PigeonPet } from './pigeon';
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
  ginger: () => new GingerPet(),
  'blue-kit': () => new BlueKitPet(),
  diplodocus: () => new DiplodocusPet(),
  pigeon: () => new PigeonPet(),
};

/** Companions shown by the mirror's four-column picker. */
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
  {
    id: 'ginger',
    label: 'Ginger',
    description: 'A mellow, chunky orange tabby.',
    sprite: GINGER_SPRITE,
  },
  {
    id: 'blue-kit',
    label: 'Blue Kit',
    description: 'A tiny blue mackerel tabby who loves to play.',
    sprite: BLUE_KIT_SPRITE,
  },
  {
    id: 'diplodocus',
    label: 'Diplo',
    description: 'A gentle green baby longneck.',
    sprite: DIPLODOCUS_SPRITE,
  },
  {
    id: 'pigeon',
    label: 'Pigeon',
    description: 'A plump city pigeon with a proud little waddle.',
    sprite: PIGEON_SPRITE,
  },
];

/** Instantiate a fresh pet for the given folder-backed id. */
export function createPet(id: string): Pet | null {
  return REGISTRY[id]?.() ?? null;
}

export type { Pet } from './pet';
