import type { Pet } from './pet';
import { PetContext, PetPose } from './pet-types';

/** Sprite footprint, used for edge clamping. */
export const PET_SIZE = 44;

/**
 * State pattern for the pet's behaviour/animation FSM. A state advances the pet
 * each tick (`tick`) and, when its business is done, returns the *next* state
 * (or null to stay). `pose` produces the procedural keyframe for the current
 * moment. Base `update` keeps `elapsed` (seconds in this state) for both.
 */
export abstract class PetState {
  abstract readonly name: string;
  protected elapsed = 0;
  protected duration = 0;

  get animationTime(): number {
    return this.elapsed;
  }

  enter(pet: Pet, ctx: PetContext): void {}
  exit(pet: Pet): void {}

  update(pet: Pet, ctx: PetContext): PetState | null {
    this.elapsed += ctx.dt;
    return this.tick(pet, ctx);
  }

  protected abstract tick(pet: Pet, ctx: PetContext): PetState | null;
  abstract pose(pet: Pet): PetPose;
}

/** Sitting/resting: a slow breathing idle that ends in a personality choice. */
export class RestState extends PetState {
  readonly name = 'rest';
  override enter(pet: Pet): void {
    this.duration = 1.4 + Math.random() * 3 * (0.5 + pet.personality.restfulness);
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.y = pet.homeY(ctx);
    return this.elapsed > this.duration ? pet.chooseNext(ctx) : null;
  }
  pose(): PetPose {
    return { scaleY: 1 + Math.sin(this.elapsed * 2) * 0.03 };
  }
}

/** A short ambient expression using the sheet's secondary idle row. */
export class CuriousState extends PetState {
  readonly name = 'curious';
  override enter(): void {
    this.duration = 1.5;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.y = pet.homeY(ctx);
    return this.elapsed > this.duration ? pet.newRest() : null;
  }
  pose(): PetPose {
    return {};
  }
}

/** Walk back and forth along the home line with a bobbing gait. */
export class WalkState extends PetState {
  readonly name = 'walk';
  override enter(pet: Pet): void {
    this.duration = 2 + Math.random() * 3;
    if (Math.random() < 0.5) pet.facing = (pet.facing * -1) as 1 | -1;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.x += pet.facing * pet.personality.speed * ctx.dt;
    if (pet.x < 0) { pet.x = 0; pet.facing = 1; }
    if (pet.x > ctx.width - pet.width) { pet.x = ctx.width - pet.width; pet.facing = -1; }
    pet.y = pet.homeY(ctx);
    return this.elapsed > this.duration ? pet.newRest() : null;
  }
  pose(): PetPose {
    return {
      dy: -Math.abs(Math.sin(this.elapsed * 9)) * 3,
      rotate: Math.sin(this.elapsed * 9) * 4,
    };
  }
}

/** Curl up and snooze with a 💤; wakes to rest. */
export class SleepState extends PetState {
  readonly name = 'sleep';
  override enter(): void {
    this.duration = 4 + Math.random() * 6;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.y = pet.homeY(ctx);
    return this.elapsed > this.duration ? pet.newRest() : null;
  }
  pose(): PetPose {
    return { rotate: 6, scaleY: 1 + Math.sin(this.elapsed * 1.3) * 0.04, bubble: '💤' };
  }
}

/** Chase the pointer excitedly, then tire back to rest. */
export class PlayState extends PetState {
  readonly name = 'play';
  override enter(): void {
    this.duration = 3 + Math.random() * 2;
  }
  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    const target = ctx.pointer.x - pet.width / 2;
    const dx = target - pet.x;
    pet.facing = dx >= 0 ? 1 : -1;
    pet.x += Math.sign(dx) * Math.min(Math.abs(dx), pet.personality.speed * 1.8 * ctx.dt);
    pet.y = pet.homeY(ctx);
    if (this.elapsed > this.duration || (Math.abs(dx) < 6 && this.elapsed > 1)) return pet.newRest();
    return null;
  }
  pose(): PetPose {
    return { dy: -Math.abs(Math.sin(this.elapsed * 14)) * 5, bubble: '❤' };
  }
}
