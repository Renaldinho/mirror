import { Pet } from './pet';
import { BLUE_KIT_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** Tiny, quick, curious, and much more interested in play than naps. */
export class BlueKitPet extends Pet {
  readonly id = 'blue-kit';
  readonly name = 'Blue Kit';
  readonly personality: Personality = {
    speed: 46,
    sleepiness: 0.22,
    playfulness: 0.7,
    restfulness: 0.28,
  };
  protected override readonly spriteSheet = BLUE_KIT_SPRITE;
}
