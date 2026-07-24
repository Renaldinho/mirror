import { Pet } from './pet';
import { CAPY_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** Unflappable and easy-going, with the occasional orange-powered dash. */
export class CapyPet extends Pet {
  readonly id = 'capy';
  readonly name = 'Capy';
  readonly personality: Personality = {
    speed: 28,
    sleepiness: 0.3,
    playfulness: 0.18,
    restfulness: 0.9,
  };
  protected override readonly spriteSheet = CAPY_SPRITE;
}
