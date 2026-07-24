import { CuriousState, PetState, PlayState, RestState, SleepState, WalkState } from './pet-state';
import {
  Personality,
  PetContext,
  PetSpriteAnimation,
  PetSpriteFrame,
  PetSpriteSheet,
  PetView,
} from './pet-types';

/**
 * Abstract base for every desktop pet. Owns position/facing, runs the state
 * machine, and turns the active state's pose into a `PetView` for the renderer.
 * Subclasses supply temperament and a sprite sheet, and may override the
 * default state constructors to change locomotion.
 */
export abstract class Pet {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly personality: Personality;
  protected abstract readonly spriteSheet: PetSpriteSheet;

  x = 120;
  y = 0;
  facing: 1 | -1 = 1;

  private state: PetState | null = null;
  private pokeStart = -1;
  private reaction: PetSpriteAnimation | null = null;

  /** Horizontal footprint used by movement and edge clamping. */
  get width(): number {
    return this.spriteSheet.displayWidth;
  }

  /** Baseline y for floor-walking companions. */
  homeY(ctx: PetContext): number {
    return ctx.floorY;
  }

  // Default state factory — subclasses override for custom locomotion.
  newRest(): PetState { return new RestState(); }
  newWalk(): PetState { return new WalkState(); }
  newSleep(): PetState { return new SleepState(); }
  newPlay(): PetState { return new PlayState(); }
  newCurious(): PetState { return new CuriousState(); }

  /**
   * Personality-weighted decision made whenever an idle finishes. Energy (0..1)
   * tilts the odds — a lively pet plays/wanders, a tired one naps — but every
   * branch reuses an animation the sheet already has.
   */
  chooseNext(ctx: PetContext): PetState {
    const p = this.personality;
    const energy = ctx.energy;
    if (Math.random() < 0.14) return this.newCurious();
    const r = Math.random();
    const playChance = ctx.pointer.active ? p.playfulness * (0.4 + energy) : 0;
    const sleepChance = p.sleepiness + (1 - energy) * 0.5; // tired → naps more
    if (r < playChance) return this.newPlay();
    if (r < playChance + sleepChance) return this.newSleep();
    return this.newWalk();
  }

  setState(s: PetState, ctx: PetContext): void {
    this.state?.exit(this);
    this.state = s;
    s.enter(this, ctx);
  }

  update(ctx: PetContext): void {
    if (!this.state) {
      this.y = this.homeY(ctx);
      this.setState(this.newRest(), ctx);
    }
    // Dim the mirror and the companion curls up to sleep (existing sleep state).
    if (ctx.dim && this.state!.name !== 'sleep') {
      this.setState(this.newSleep(), ctx);
    }
    const next = this.state!.update(this, ctx);
    if (next) this.setState(next, ctx);
  }

  /** Pick one of the supplied interaction strips whenever the pet is clicked. */
  poke(): void {
    const reactions = this.spriteSheet.reactions;
    this.reaction = reactions[Math.floor(Math.random() * reactions.length)] ?? reactions[0];
    this.pokeStart = performance.now();
  }

  /** Feeding: play a *positive* existing reaction (sparkle, else wave). */
  feed(): void {
    const reactions = this.spriteSheet.reactions;
    this.reaction =
      reactions.find((r) => r.row === 8) ??
      reactions.find((r) => r.row === 3) ??
      reactions[0];
    this.pokeStart = performance.now();
  }

  view(): PetView {
    const pose = this.state ? this.state.pose(this) : {};
    let dy = pose.dy ?? 0;
    let bubble = pose.bubble ?? null;
    let pokeTime: number | null = null;

    if (this.pokeStart >= 0 && this.reaction) {
      const elapsedMs = performance.now() - this.pokeStart;
      const durationMs = Math.max(650, (this.reaction.frames / this.reaction.fps) * 1000);
      const p = elapsedMs / durationMs;
      if (p >= 1) {
        this.pokeStart = -1;
        this.reaction = null;
      }
      else {
        pokeTime = elapsedMs / 1000;
        if (this.reaction.row === 4) dy += -Math.sin(p * Math.PI) * 22;
        bubble = bubble ?? this.reactionBubble(this.reaction.row);
      }
    }

    const animation = this.animationFor(pokeTime);
    const sprite = this.spriteFrame(animation, pokeTime);
    const rot = pose.rotate ?? 0;
    const hasDirectionalRows = animation.reverseRow !== undefined;
    const spriteFacing = hasDirectionalRows ? 1 : this.facing;
    const sx = (pose.scaleX ?? 1) * spriteFacing;
    const sy = pose.scaleY ?? 1;
    const visualWidth = this.spriteSheet.displayWidth;
    const visualHeight = this.spriteSheet.displayHeight;
    return {
      x: this.x,
      y: this.y,
      sprite,
      visualWidth,
      visualHeight,
      innerTransform: `translateY(${dy}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
      bubble,
    };
  }

  private animationFor(pokeTime: number | null): PetSpriteAnimation {
    if (pokeTime !== null && this.reaction) return this.reaction;
    return this.spriteSheet.animations[this.state?.name ?? 'rest'] ??
      this.spriteSheet.animations['rest'];
  }

  private spriteFrame(
    animation: PetSpriteAnimation,
    pokeTime: number | null,
  ): PetSpriteFrame {
    const sheet = this.spriteSheet;
    const time = pokeTime ?? this.state?.animationTime ?? 0;
    const rawFrame = Math.floor(time * animation.fps);
    const column = animation.loop === false
      ? Math.min(rawFrame, animation.frames - 1)
      : rawFrame % animation.frames;
    const row = this.facing === -1 && animation.reverseRow !== undefined
      ? animation.reverseRow
      : animation.row;

    return { sheet, row, column };
  }

  private reactionBubble(row: number): string | null {
    if (row === 3) return '♡';
    if (row === 4) return '❗';
    if (row === 5) return '💧';
    if (row === 8) return '✦';
    return null;
  }
}
