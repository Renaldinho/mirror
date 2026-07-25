import { Pet } from './pet';
import { PIGEON_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** Alert and street-smart, with a brisk waddle and an occasional wing flourish. */
export class PigeonPet extends Pet {
  readonly id = 'pigeon';
  readonly name = 'Pigeon';
  readonly personality: Personality = {
    speed: 42,
    sleepiness: 0.14,
    playfulness: 0.38,
    restfulness: 0.42,
  };
  protected override readonly spriteSheet = PIGEON_SPRITE;
}
