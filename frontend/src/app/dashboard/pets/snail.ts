import { Pet } from './pet';
import { Personality } from './pet-types';

/** All the time in the world: very slow, very restful, never plays. */
export class SnailPet extends Pet {
  readonly id = 'snail';
  readonly name = 'Snail';
  readonly personality: Personality = { speed: 9, sleepiness: 0.25, playfulness: 0, restfulness: 0.95 };
  protected readonly emojiByState: Record<string, string> = {};
  protected readonly defaultEmoji = '🐌';
}
