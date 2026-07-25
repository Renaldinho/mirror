import { Pet } from './pet';
import { DIPLODOCUS_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** A gentle baby longneck with an unhurried walk and a fondness for resting. */
export class DiplodocusPet extends Pet {
  readonly id = 'diplodocus';
  readonly name = 'Diplo';
  readonly personality: Personality = {
    speed: 26,
    sleepiness: 0.22,
    playfulness: 0.28,
    restfulness: 0.72,
  };
  protected override readonly spriteSheet = DIPLODOCUS_SPRITE;
}
