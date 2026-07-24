import { Pet } from './pet';
import { COLLIE_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** Boundless energy: fast, rarely sleeps, and loves chasing the pointer. */
export class ColliePet extends Pet {
  readonly id = 'lando';
  readonly name = 'Lando';
  readonly personality: Personality = {
    speed: 52,
    sleepiness: 0.08,
    playfulness: 0.55,
    restfulness: 0.3,
  };
  protected override readonly spriteSheet = COLLIE_SPRITE;
}
