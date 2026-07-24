import { CatPet } from './cat';
import { FrogPet } from './frog';
import { MothPet } from './moth';
import { Pet } from './pet';
import { PuppyPet } from './puppy';
import { SnailPet } from './snail';
import { SpiderPet } from './spider';

/** Picker metadata (id + display emoji + label). */
export interface PetInfo {
  id: string;
  emoji: string;
  label: string;
}

const REGISTRY: Record<string, () => Pet> = {
  cat: () => new CatPet(),
  puppy: () => new PuppyPet(),
  spider: () => new SpiderPet(),
  moth: () => new MothPet(),
  frog: () => new FrogPet(),
  snail: () => new SnailPet(),
};

export const PET_CATALOG: PetInfo[] = [
  { id: 'cat', emoji: '🐈', label: 'Cat' },
  { id: 'puppy', emoji: '🐕', label: 'Puppy' },
  { id: 'spider', emoji: '🕷️', label: 'Spider' },
  { id: 'moth', emoji: '🦋', label: 'Moth' },
  { id: 'frog', emoji: '🐸', label: 'Frog' },
  { id: 'snail', emoji: '🐌', label: 'Snail' },
];

/** Instantiate a fresh pet for the given id (null if unknown/none). */
export function createPet(id: string): Pet | null {
  return REGISTRY[id]?.() ?? null;
}

export type { Pet } from './pet';
