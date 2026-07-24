/** Everything a pet needs to know about the world on a given tick. */
export interface PetContext {
  /** requestAnimationFrame timestamp (ms). */
  now: number;
  /** seconds since last tick, clamped. */
  dt: number;
  width: number;
  height: number;
  /** y of the floor where floor-walkers stand. */
  floorY: number;
  pointer: { x: number; y: number; active: boolean };
}

/** Behaviour weights that give each species its temperament. */
export interface Personality {
  /** base walking speed, px/s. */
  speed: number;
  /** 0..1 tendency to nap when idle. */
  sleepiness: number;
  /** 0..1 tendency to chase the pointer. */
  playfulness: number;
  /** 0..1 how long it lingers at rest. */
  restfulness: number;
}

/** A single procedural animation frame produced by a state each tick. */
export interface PetPose {
  /** vertical offset for the sprite (bob / hop / arc). */
  dy?: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  /** override the pet's emoji for this frame. */
  emoji?: string;
  /** little status glyph above the pet (💤, ❤, ❗). */
  bubble?: string;
  /** spider-thread length in px, rendered above the sprite. */
  thread?: number;
}

/** What the renderer paints for the current tick. */
export interface PetView {
  x: number;
  y: number;
  emoji: string;
  innerTransform: string;
  bubble: string | null;
  thread: number | null;
}
