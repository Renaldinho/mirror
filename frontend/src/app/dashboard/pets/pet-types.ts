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
  /** Companion energy 0..1 — biases which existing states run (tired vs lively). */
  energy: number;
  /** True when the mirror is dark/dimmed — the pet should curl up and sleep. */
  dim: boolean;
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

/** One animation strip inside a fixed-grid sprite sheet. */
export interface PetSpriteAnimation {
  /** Zero-based sheet row. */
  row: number;
  /** Number of populated frames in the row. */
  frames: number;
  fps: number;
  /** Optional row containing the same animation facing left. */
  reverseRow?: number;
  /** Defaults to true. */
  loop?: boolean;
}

/** Layout and state mapping for a pet's sprite sheet. */
export interface PetSpriteSheet {
  cssClass: string;
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  displayWidth: number;
  displayHeight: number;
  animations: Readonly<Record<string, PetSpriteAnimation>>;
  reactions: readonly PetSpriteAnimation[];
}

/** The exact sheet cell selected for this render frame. */
export interface PetSpriteFrame {
  sheet: PetSpriteSheet;
  row: number;
  column: number;
}

/** A single procedural animation frame produced by a state each tick. */
export interface PetPose {
  /** vertical offset for the sprite (bob / hop / arc). */
  dy?: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  /** Little status glyph above the pet (💤, ❤, ❗). */
  bubble?: string;
}

/** What the renderer paints for the current tick. */
export interface PetView {
  x: number;
  y: number;
  sprite: PetSpriteFrame;
  visualWidth: number;
  visualHeight: number;
  innerTransform: string;
  bubble: string | null;
}
