import { Pet } from './pet';
import { GINGER_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** A mellow, chunky tabby who watches thrown balls without fetching them. */
export class GingerPet extends Pet {
  readonly id = 'ginger';
  readonly name = 'Ginger';
  override readonly canFetch = false;
  readonly personality: Personality = {
    speed: 24,
    sleepiness: 0.46,
    playfulness: 0.22,
    restfulness: 0.85,
  };
  protected override readonly spriteSheet = GINGER_SPRITE;
}
