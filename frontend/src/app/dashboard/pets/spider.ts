import { Pet } from './pet';
import { PetState } from './pet-state';
import { Personality, PetContext, PetPose } from './pet-types';

/** Descend on a silk thread, dangle, then climb back up. */
class DropState extends PetState {
  readonly name = 'drop';
  private home = 0;
  private drop = 0;
  private phase: 'down' | 'hang' | 'up' = 'down';
  private hangT = 0;

  override enter(pet: Pet, ctx: PetContext): void {
    this.home = pet.homeY(ctx);
    this.drop = 110 + Math.random() * 160;
    this.phase = 'down';
    this.hangT = 0;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    const speed = 150;
    if (this.phase === 'down') {
      pet.y += speed * ctx.dt;
      if (pet.y >= this.home + this.drop) { pet.y = this.home + this.drop; this.phase = 'hang'; }
    } else if (this.phase === 'hang') {
      this.hangT += ctx.dt;
      if (this.hangT > 1.2 + Math.random()) this.phase = 'up';
    } else {
      pet.y -= speed * ctx.dt;
      if (pet.y <= this.home) { pet.y = this.home; return pet.newRest(); }
    }
    return null;
  }
  pose(pet: Pet): PetPose {
    return { thread: Math.max(0, pet.y - this.home), rotate: Math.sin(this.elapsed * 3) * 5 };
  }
}

/** Lives along the top edge; crawls, and now and then rappels down a thread. */
export class SpiderPet extends Pet {
  readonly id = 'spider';
  readonly name = 'Spider';
  readonly personality: Personality = { speed: 34, sleepiness: 0.05, playfulness: 0, restfulness: 0.4 };
  protected readonly emojiByState: Record<string, string> = {};
  protected readonly defaultEmoji = '🕷️';

  override homeY(): number {
    return 8; // clings to the top
  }
  override chooseNext(ctx: PetContext): PetState {
    return Math.random() < 0.35 ? new DropState() : this.newWalk();
  }
}
