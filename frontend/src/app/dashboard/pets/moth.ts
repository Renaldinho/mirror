import { Pet } from './pet';
import { PET_SIZE, PetState } from './pet-state';
import { Personality, PetContext, PetPose } from './pet-types';

/** Fluttering flight that floats above the floor and drifts across. */
class FlyState extends PetState {
  readonly name = 'fly';
  override enter(): void {
    this.duration = 3 + Math.random() * 4;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.x += pet.facing * pet.personality.speed * ctx.dt;
    if (pet.x < 0) { pet.x = 0; pet.facing = 1; }
    if (pet.x > ctx.width - PET_SIZE) { pet.x = ctx.width - PET_SIZE; pet.facing = -1; }
    const hover = ctx.floorY - 140;
    pet.y = hover + Math.sin(this.elapsed * 2.4) * 44 + Math.sin(this.elapsed * 0.8) * 22;
    return this.elapsed > this.duration ? pet.newRest() : null;
  }
  pose(): PetPose {
    return {
      rotate: Math.sin(this.elapsed * 22) * 10,
      scaleX: 1 - Math.abs(Math.sin(this.elapsed * 22)) * 0.15,
    };
  }
}

/** Restless flier that rarely sleeps; "walking" is flight. */
export class MothPet extends Pet {
  readonly id = 'moth';
  readonly name = 'Moth';
  readonly personality: Personality = { speed: 40, sleepiness: 0.05, playfulness: 0.1, restfulness: 0.2 };
  protected readonly emojiByState: Record<string, string> = {};
  protected readonly defaultEmoji = '🦋';

  override newWalk(): PetState {
    return new FlyState();
  }
}
