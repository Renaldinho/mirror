import {
  CuriousState,
  EatState,
  PetState,
  PlayState,
  RestState,
  SleepState,
  WalkState,
} from './pet-state';
import {
  Personality,
  PetContext,
  PetDirection,
  PetSpriteAnimation,
  PetSpriteFrame,
  PetSpriteSheet,
  PetView,
} from './pet-types';

/**
 * Base companion: owns position/direction, runs the behaviour state machine,
 * and resolves each state to a cell in the species' common action atlas.
 */
export abstract class Pet {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly personality: Personality;
  protected abstract readonly spriteSheet: PetSpriteSheet;

  x = 120;
  y = 0;
  facing: 1 | -1 = 1;
  direction: PetDirection = 'down';

  private state: PetState | null = null;
  private pokeStart = -1;
  private reaction: PetSpriteAnimation | null = null;
  private lastContext: PetContext | null = null;
  private pendingFeed = false;

  get width(): number {
    return this.spriteSheet.displayWidth;
  }

  get stateName(): string {
    return this.state?.name ?? 'rest';
  }

  /** Initial baseline for newly-created companions. */
  homeY(ctx: PetContext): number {
    return ctx.floorY;
  }

  /** Highest baseline the companion may roam to without disappearing under chrome. */
  roamTop(ctx: PetContext): number {
    return Math.min(ctx.floorY, Math.max(84, ctx.height * .16));
  }

  clampPosition(ctx: PetContext): void {
    this.x = Math.max(0, Math.min(Math.max(0, ctx.width - this.width), this.x));
    this.y = Math.max(this.roamTop(ctx), Math.min(ctx.floorY, this.y));
  }

  setMotionDirection(dx: number, dy: number): void {
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx >= 0 ? 'right' : 'left';
      this.facing = dx >= 0 ? 1 : -1;
    } else {
      this.direction = dy >= 0 ? 'down' : 'up';
    }
  }

  newRest(): PetState { return new RestState(); }
  newWalk(): PetState { return new WalkState(); }
  newSleep(): PetState { return new SleepState(); }
  newEat(): PetState { return new EatState(); }
  newPlay(): PetState { return new PlayState(); }
  newCurious(): PetState { return new CuriousState(); }

  chooseNext(ctx: PetContext): PetState {
    const p = this.personality;
    const energy = ctx.energy;
    if (Math.random() < .14) return this.newCurious();
    const roll = Math.random();
    const playChance = ctx.pointer.active ? p.playfulness * (.4 + energy) : 0;
    const sleepChance = p.sleepiness + (1 - energy) * .5;
    if (roll < playChance) return this.newPlay();
    if (roll < playChance + sleepChance) return this.newSleep();
    return this.newWalk();
  }

  setState(state: PetState, ctx: PetContext): void {
    this.state?.exit(this);
    this.state = state;
    state.enter(this, ctx);
  }

  update(ctx: PetContext): void {
    this.lastContext = ctx;
    if (!this.state) {
      this.y = this.homeY(ctx);
      this.setState(this.newRest(), ctx);
    }
    if (this.pendingFeed) {
      this.pendingFeed = false;
      this.setState(this.newEat(), ctx);
    } else if (ctx.dim && this.state!.name !== 'sleep' && this.state!.name !== 'eat') {
      this.setState(this.newSleep(), ctx);
    }

    const next = this.state!.update(this, ctx);
    if (next) this.setState(next, ctx);
  }

  /** Play the consistent happy strip when a non-feeding interaction is added. */
  poke(): void {
    const reactions = this.spriteSheet.reactions;
    this.reaction = reactions[Math.floor(Math.random() * reactions.length)] ?? reactions[0];
    this.pokeStart = performance.now();
  }

  /** Feeding is a real stationary state, not an overlay on a moving pet. */
  feed(): void {
    if (this.lastContext) {
      this.setState(this.newEat(), this.lastContext);
    } else {
      this.pendingFeed = true;
    }
  }

  view(): PetView {
    const pose = this.state ? this.state.pose(this) : {};
    let dy = pose.dy ?? 0;
    let bubble = pose.bubble ?? null;
    let pokeTime: number | null = null;

    if (this.pokeStart >= 0 && this.reaction) {
      const elapsedMs = performance.now() - this.pokeStart;
      const durationMs = Math.max(650, (this.reaction.frames / this.reaction.fps) * 1000);
      const progress = elapsedMs / durationMs;
      if (progress >= 1) {
        this.pokeStart = -1;
        this.reaction = null;
      } else {
        pokeTime = elapsedMs / 1000;
        dy -= Math.sin(progress * Math.PI) * 10;
        bubble = bubble ?? '✦';
      }
    }

    const animation = this.animationFor(pokeTime);
    const sprite = this.spriteFrame(animation, pokeTime);
    const rotation = pose.rotate ?? 0;
    const directional = animation.directionRows !== undefined || animation.reverseRow !== undefined;
    const spriteFacing = directional ? 1 : this.facing;
    const scaleX = (pose.scaleX ?? 1) * spriteFacing;
    const scaleY = pose.scaleY ?? 1;

    return {
      x: this.x,
      y: this.y,
      sprite,
      visualWidth: this.spriteSheet.displayWidth,
      visualHeight: this.spriteSheet.displayHeight,
      innerTransform: `translateY(${dy}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
      bubble,
    };
  }

  private animationFor(pokeTime: number | null): PetSpriteAnimation {
    if (pokeTime !== null && this.reaction) return this.reaction;
    return this.spriteSheet.animations[this.stateName] ?? this.spriteSheet.animations['rest'];
  }

  private spriteFrame(animation: PetSpriteAnimation, pokeTime: number | null): PetSpriteFrame {
    const time = pokeTime ?? this.state?.animationTime ?? 0;
    const rawFrame = Math.floor(time * animation.fps);
    const column = animation.loop === false
      ? Math.min(rawFrame, animation.frames - 1)
      : rawFrame % animation.frames;
    const row = animation.directionRows?.[this.direction] ??
      (this.facing === -1 && animation.reverseRow !== undefined
        ? animation.reverseRow
        : animation.row);

    return { sheet: this.spriteSheet, row, column };
  }
}
