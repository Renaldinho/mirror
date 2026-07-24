import { Pet } from './pet';
import { FROG_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** A springy wanderer; the shared directional atlas turns each step into a hop. */
export class FrogPet extends Pet {
  readonly id = 'frog';
  readonly name = 'Frog';
  readonly personality: Personality = { speed: 22, sleepiness: 0.2, playfulness: 0.1, restfulness: 0.6 };
  protected override readonly spriteSheet = FROG_SPRITE;
}
