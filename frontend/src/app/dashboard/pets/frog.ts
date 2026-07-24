import { Pet } from './pet';
import { FROG_SPRITE } from './pet-sprites';
import { PetState } from './pet-state';
import { Personality, PetContext, PetPose } from './pet-types';

/** A run of arcing hops with squash-and-stretch, then a rest. */
class HopState extends PetState {
  readonly name = 'hop';
  private hops = 3;
  private readonly cycle = 1.1;
  private readonly air = 0.5;

  override enter(pet: Pet): void {
    this.hops = 2 + Math.floor(Math.random() * 3);
    if (Math.random() < 0.5) pet.facing = (pet.facing * -1) as 1 | -1;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    if (this.elapsed > this.hops * this.cycle) return pet.newRest();
    pet.y = pet.homeY(ctx);
    const inCycle = this.elapsed % this.cycle;
    if (inCycle < this.air) {
      pet.x += pet.facing * pet.personality.speed * 2.6 * ctx.dt;
      if (pet.x < 0) { pet.x = 0; pet.facing = 1; }
      if (pet.x > ctx.width - pet.width) { pet.x = ctx.width - pet.width; pet.facing = -1; }
    }
    return null;
  }
  pose(): PetPose {
    const inCycle = this.elapsed % this.cycle;
    if (inCycle < this.air) {
      const p = inCycle / this.air;
      return { dy: -Math.sin(p * Math.PI) * 30, scaleY: 1.08, scaleX: 0.96 };
    }
    const p = (inCycle - this.air) / (this.cycle - this.air);
    return { scaleY: 1 - Math.sin(p * Math.PI) * 0.1 }; // crouch between hops
  }
}

/** Hops everywhere instead of walking; content to sit a while between bursts. */
export class FrogPet extends Pet {
  readonly id = 'frog';
  readonly name = 'Frog';
  readonly personality: Personality = { speed: 22, sleepiness: 0.2, playfulness: 0.1, restfulness: 0.6 };
  protected override readonly spriteSheet = FROG_SPRITE;

  override newWalk(): PetState {
    return new HopState();
  }
}
