import { PetState, PlayState, RestState, SleepState, WalkState } from './pet-state';
import { Personality, PetContext, PetView } from './pet-types';

/**
 * Abstract base for every desktop pet. Owns position/facing, runs the state
 * machine, and turns the active state's pose into a `PetView` for the renderer.
 * Subclasses supply temperament (`personality`), looks (`emoji*`), and may
 * override the default state constructors to change locomotion (fly, hop, drop)
 * or `chooseNext`/`homeY` to change behaviour and where they live.
 */
export abstract class Pet {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly personality: Personality;
  /** optional per-state emoji overrides; falls back to `defaultEmoji`. */
  protected abstract readonly emojiByState: Record<string, string>;
  protected abstract readonly defaultEmoji: string;

  x = 120;
  y = 0;
  facing: 1 | -1 = 1;

  private state: PetState | null = null;
  private pokeStart = -1;

  /** Baseline y; floor-walkers stay on the floor, others (e.g. spider) override. */
  homeY(ctx: PetContext): number {
    return ctx.floorY;
  }

  // Default state factory — subclasses override for custom locomotion.
  newRest(): PetState { return new RestState(); }
  newWalk(): PetState { return new WalkState(); }
  newSleep(): PetState { return new SleepState(); }
  newPlay(): PetState { return new PlayState(); }

  /** Personality-weighted decision made whenever an idle finishes. */
  chooseNext(ctx: PetContext): PetState {
    const p = this.personality;
    const r = Math.random();
    if (ctx.pointer.active && r < p.playfulness) return this.newPlay();
    if (r < p.playfulness + p.sleepiness) return this.newSleep();
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
    const next = this.state!.update(this, ctx);
    if (next) this.setState(next, ctx);
  }

  /** Poked by the user — a universal startle hop; subclasses can add more. */
  poke(): void {
    this.pokeStart = performance.now();
    this.onPoke();
  }
  protected onPoke(): void {}

  view(): PetView {
    const pose = this.state ? this.state.pose(this) : {};
    let dy = pose.dy ?? 0;
    let bubble = pose.bubble ?? null;

    if (this.pokeStart >= 0) {
      const p = (performance.now() - this.pokeStart) / 600;
      if (p >= 1) this.pokeStart = -1;
      else {
        dy += -Math.sin(p * Math.PI) * 22;
        bubble = bubble ?? '❗';
      }
    }

    const rot = pose.rotate ?? 0;
    const sx = (pose.scaleX ?? 1) * this.facing;
    const sy = pose.scaleY ?? 1;
    return {
      x: this.x,
      y: this.y,
      emoji: pose.emoji ?? this.emojiByState[this.state?.name ?? ''] ?? this.defaultEmoji,
      innerTransform: `translateY(${dy}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
      bubble,
      thread: pose.thread ?? null,
    };
  }
}
