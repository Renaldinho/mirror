import type { Pet } from './pet';
import { CozyActivityAnchor } from './cozy-types';
import { PetContext, PetPose } from './pet-types';

/** Vertical anchor from a pet's position to the bottom of its visual. */
export const PET_SIZE = 44;

/** One state in the companion behaviour machine. */
export abstract class PetState {
  abstract readonly name: string;
  readonly activity: 'sleep' | 'watch' | null = null;
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

/** A breathing front-facing idle that ends in a personality choice. */
export class RestState extends PetState {
  readonly name = 'rest';

  override enter(pet: Pet): void {
    this.duration = 1.4 + Math.random() * 3 * (.5 + pet.personality.restfulness);
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.clampPosition(ctx);
    return this.elapsed > this.duration ? pet.chooseNext(ctx) : null;
  }

  pose(): PetPose {
    return { scaleY: 1 + Math.sin(this.elapsed * 2) * .02 };
  }
}

/** A short happy ambient expression. */
export class CuriousState extends PetState {
  readonly name = 'curious';

  override enter(): void {
    this.duration = 1.2;
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.clampPosition(ctx);
    return this.elapsed > this.duration ? pet.newRest() : null;
  }

  pose(): PetPose {
    return {};
  }
}

/** Wander toward a stable point in the two-dimensional desktop space. */
export class WalkState extends PetState {
  readonly name = 'walk';
  private targetX = 0;
  private targetY = 0;

  override enter(pet: Pet, ctx: PetContext): void {
    this.duration = 4 + Math.random() * 4;
    const maxX = Math.max(0, ctx.width - pet.width);
    const minY = pet.roamTop(ctx);
    this.targetX = Math.random() * maxX;
    this.targetY = minY + Math.random() * Math.max(0, ctx.floorY - minY);

    if (Math.hypot(this.targetX - pet.x, this.targetY - pet.y) < 90) {
      this.targetX = pet.x < maxX / 2 ? maxX * .82 : maxX * .18;
      this.targetY = pet.y < (minY + ctx.floorY) / 2 ? ctx.floorY * .86 : minY;
    }
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    const arrived = movePet(pet, ctx, this.targetX, this.targetY, pet.personality.speed);
    return arrived || this.elapsed > this.duration ? pet.newRest() : null;
  }

  pose(pet: Pet): PetPose {
    const vertical = pet.direction === 'up' || pet.direction === 'down';
    return {
      dy: -Math.abs(Math.sin(this.elapsed * 9)) * (pet.id === 'frog' ? 5 : 2),
      rotate: vertical ? 0 : Math.sin(this.elapsed * 9) * 2,
    };
  }
}

/** Use the dedicated curled-up sleep strip and remain asleep while dimmed. */
export class SleepState extends PetState {
  override readonly activity = 'sleep' as const;
  private target: CozyActivityAnchor | null;
  private settled: boolean;

  constructor(target: CozyActivityAnchor | null = null, settled = false) {
    super();
    this.target = target;
    this.settled = settled;
  }

  override get name(): string {
    return this.settled ? 'sleep' : 'walk';
  }

  override enter(pet: Pet, ctx: PetContext): void {
    this.duration = 4 + Math.random() * 6;
    this.target ??= nearestAnchor(pet, ctx.cozy?.sleepSpots ?? []);
    if (!this.target) this.settled = true;
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    if (!this.settled && this.target) {
      const arrived = movePet(
        pet,
        ctx,
        this.target.x - pet.width / 2,
        this.target.y,
        pet.personality.speed * 1.15,
      );
      if (!arrived) return null;
      this.settled = true;
      this.elapsed = 0;
    }
    pet.clampPosition(ctx);
    if (ctx.dim) return null;
    return this.elapsed > this.duration ? pet.newRest() : null;
  }

  pose(): PetPose {
    // The sleep atlas already contains its own small Z symbols.
    return { scaleY: 1 + Math.sin(this.elapsed * 1.3) * .025 };
  }
}

/** Walk to an enabled television, face it, and linger for a short watch. */
export class WatchState extends PetState {
  override readonly activity = 'watch' as const;
  private target: CozyActivityAnchor | null = null;
  private settled = false;

  override get name(): string {
    return this.settled ? 'curious' : 'walk';
  }

  override enter(pet: Pet, ctx: PetContext): void {
    this.duration = 4 + Math.random() * 4;
    this.target = nearestAnchor(pet, ctx.cozy?.watchSpots ?? []);
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    if (!this.target || !ctx.cozy?.watchSpots.some((spot) => spot.itemId === this.target!.itemId)) {
      return pet.newRest();
    }
    if (!this.settled) {
      const arrived = movePet(
        pet,
        ctx,
        this.target.x - pet.width / 2,
        this.target.y,
        pet.personality.speed,
      );
      if (!arrived) return null;
      this.settled = true;
      this.elapsed = 0;
      pet.setMotionDirection(
        (this.target.faceX ?? this.target.x) - (pet.x + pet.width / 2),
        (this.target.faceY ?? this.target.y) - pet.y,
      );
    }
    return this.elapsed > this.duration ? pet.newRest() : null;
  }

  pose(): PetPose {
    return this.settled
      ? { bubble: 'â—‹' }
      : { dy: -Math.abs(Math.sin(this.elapsed * 8)) * 2 };
  }
}

/** Stop roaming and play the species-specific food strip from start to finish. */
export class EatState extends PetState {
  readonly name = 'eat';

  override enter(): void {
    this.duration = 1.6;
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.clampPosition(ctx);
    return this.elapsed > this.duration ? pet.newRest() : null;
  }

  pose(): PetPose {
    return { bubble: '♡' };
  }
}

/** A short, calm picked-up pose while the user is carrying the pet. */
export class HeldState extends PetState {
  readonly name = 'held';

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.clampPosition(ctx);
    return null;
  }

  pose(): PetPose {
    return { dy: -8, rotate: -2, scaleY: .98 };
  }
}

/** Pursue the live ball target supplied by the fetch controller. */
export class FetchState extends PetState {
  readonly name = 'fetch';

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    if (ctx.fetch?.mode !== 'chase') return null;
    movePet(pet, ctx, ctx.fetch.targetX, ctx.fetch.targetY, ctx.fetch.speed);
    return null;
  }

  pose(pet: Pet): PetPose {
    return {
      dy: -Math.abs(Math.sin(this.elapsed * 13)) * (pet.id === 'frog' ? 7 : 3),
    };
  }
}

/** Dedicated stationary pickup strip; its timing is owned by the controller. */
export class FetchPickupState extends PetState {
  readonly name = 'pickup';

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.clampPosition(ctx);
    return null;
  }

  pose(): PetPose {
    return {};
  }
}

/** Carry the fetched ball toward the current pointer position. */
export class FetchCarryState extends PetState {
  readonly name = 'carry';

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    if (ctx.fetch?.mode !== 'carry') return null;
    movePet(pet, ctx, ctx.fetch.targetX, ctx.fetch.targetY, ctx.fetch.speed);
    return null;
  }

  pose(pet: Pet): PetPose {
    return {
      dy: -Math.abs(Math.sin(this.elapsed * 10)) * (pet.id === 'frog' ? 5 : 2),
    };
  }
}

/** Stationary handoff strip before the world ball reappears beside the cursor. */
export class FetchDeliverState extends PetState {
  readonly name = 'deliver';

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    pet.clampPosition(ctx);
    return null;
  }

  pose(): PetPose {
    return { bubble: '♡' };
  }
}

/** Chase the live pointer in both axes, then tire back to rest. */
export class PlayState extends PetState {
  readonly name = 'play';

  override enter(): void {
    this.duration = 3 + Math.random() * 2;
  }

  protected tick(pet: Pet, ctx: PetContext): PetState | null {
    const arrived = movePet(
      pet,
      ctx,
      ctx.pointer.x - pet.width / 2,
      ctx.pointer.y,
      pet.personality.speed * 1.8,
    );
    if (this.elapsed > this.duration || (arrived && this.elapsed > 1)) return pet.newRest();
    return null;
  }

  pose(pet: Pet): PetPose {
    return {
      dy: -Math.abs(Math.sin(this.elapsed * 14)) * (pet.id === 'frog' ? 7 : 4),
      bubble: '❤',
    };
  }
}

function movePet(
  pet: Pet,
  ctx: PetContext,
  targetX: number,
  targetY: number,
  speed: number,
): boolean {
  const boundedX = Math.max(0, Math.min(Math.max(0, ctx.width - pet.width), targetX));
  const boundedY = Math.max(pet.roamTop(ctx), Math.min(ctx.floorY, targetY));
  const dx = boundedX - pet.x;
  const dy = boundedY - pet.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 4) {
    pet.x = boundedX;
    pet.y = boundedY;
    return true;
  }

  pet.setMotionDirection(dx, dy);
  const step = Math.min(distance, speed * ctx.dt);
  pet.x += dx / distance * step;
  pet.y += dy / distance * step;
  pet.clampPosition(ctx);
  return false;
}

function nearestAnchor(
  pet: Pet,
  anchors: readonly CozyActivityAnchor[],
): CozyActivityAnchor | null {
  const centerX = pet.x + pet.width / 2;
  return [...anchors].sort((a, b) =>
    Math.hypot(a.x - centerX, a.y - pet.y) -
    Math.hypot(b.x - centerX, b.y - pet.y)
  )[0] ?? null;
}
