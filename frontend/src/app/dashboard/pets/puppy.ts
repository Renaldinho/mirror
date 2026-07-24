import { Pet } from './pet';
import { Personality } from './pet-types';

/** Boundless energy: fast, rarely sleeps, loves to chase the pointer. */
export class PuppyPet extends Pet {
  readonly id = 'puppy';
  readonly name = 'Puppy';
  readonly personality: Personality = { speed: 52, sleepiness: 0.08, playfulness: 0.55, restfulness: 0.3 };
  protected readonly emojiByState: Record<string, string> = {};
  protected readonly defaultEmoji = '🐕';
}
