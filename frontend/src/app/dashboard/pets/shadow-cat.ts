import { Pet } from './pet';
import { SHADOW_CAT_SPRITE } from './pet-sprites';
import { Personality } from './pet-types';

/** Aloof: naps often, lingers at rest, and occasionally deigns to chase. */
export class ShadowCatPet extends Pet {
  readonly id = 'shadow-kit';
  readonly name = 'Shadow Kit';
  readonly personality: Personality = {
    speed: 24,
    sleepiness: 0.45,
    playfulness: 0.2,
    restfulness: 0.85,
  };
  protected override readonly spriteSheet = SHADOW_CAT_SPRITE;
}
