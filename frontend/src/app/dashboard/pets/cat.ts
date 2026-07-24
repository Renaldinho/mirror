import { Pet } from './pet';
import { Personality } from './pet-types';

/** Aloof: naps a lot, lingers at rest, occasionally deigns to chase. */
export class CatPet extends Pet {
  readonly id = 'cat';
  readonly name = 'Cat';
  readonly personality: Personality = { speed: 24, sleepiness: 0.45, playfulness: 0.2, restfulness: 0.85 };
  protected readonly emojiByState: Record<string, string> = {};
  protected readonly defaultEmoji = '🐈';
}
