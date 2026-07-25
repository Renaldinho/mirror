import { FetchIntent, Personality } from './pet-types';

export type BallPhase = 'ready' | 'held' | 'thrown' | 'pickup' | 'carried' | 'delivery';

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  phase: BallPhase;
  hasBounced: boolean;
}

export interface FetchBounds {
  width: number;
  height: number;
  floorY: number;
}

export interface FetchPetSnapshot {
  x: number;
  y: number;
  width: number;
  personality: Personality;
}

export interface FetchPointer {
  x: number;
  y: number;
}

interface MotionSample {
  x: number;
  y: number;
  time: number;
}

export const BALL_RADIUS = 12;
export const THROW_SAMPLE_MS = 120;
export const MAX_THROW_SPEED = 1000;
export const THROW_DISTANCE_THRESHOLD = 6;
export const GRAVITY = 1200;
export const FLOOR_RESTITUTION = .52;
export const WALL_RESTITUTION = .65;
export const ROLLING_FRICTION = 420;
export const PICKUP_DISTANCE = 36;
export const DELIVERY_DISTANCE = 28;
export const PICKUP_DURATION = 4 / 6;
export const DELIVERY_DURATION = 4 / 6;

/**
 * Pure interaction/physics coordinator for the desktop-pet fetch loop.
 * Rendering and pet animation consume its ball snapshot and fetch intent.
 */
export class BallFetchController {
  private current: BallState | null = null;
  private pointerId: number | null = null;
  private dragOrigin = { x: 0, y: 0 };
  private samples: MotionSample[] = [];
  private phaseElapsed = 0;

  get ball(): Readonly<BallState> | null {
    return this.current;
  }

  get active(): boolean {
    return this.current !== null && this.current.phase !== 'ready';
  }

  get visible(): boolean {
    return this.current !== null &&
      (this.current.phase === 'ready' ||
        this.current.phase === 'held' ||
        this.current.phase === 'thrown');
  }

  reset(pet: FetchPetSnapshot | null, bounds: FetchBounds): void {
    this.pointerId = null;
    this.samples = [];
    this.phaseElapsed = 0;
    if (!pet) {
      this.current = null;
      return;
    }

    this.current = {
      x: clamp(pet.x + pet.width + 20, BALL_RADIUS, bounds.width - BALL_RADIUS),
      y: clamp(bounds.floorY - BALL_RADIUS, BALL_RADIUS, bounds.floorY - BALL_RADIUS),
      vx: 0,
      vy: 0,
      rotation: 0,
      phase: 'ready',
      hasBounced: false,
    };
  }

  beginDrag(pointerId: number, x: number, y: number, time: number, bounds: FetchBounds): boolean {
    if (!this.current || this.current.phase !== 'ready') return false;
    this.pointerId = pointerId;
    this.dragOrigin = { x, y };
    this.samples = [];
    this.current.phase = 'held';
    this.current.vx = 0;
    this.current.vy = 0;
    this.current.hasBounced = false;
    this.recordSample(x, y, time, bounds);
    return true;
  }

  drag(pointerId: number, x: number, y: number, time: number, bounds: FetchBounds): void {
    if (!this.current || this.current.phase !== 'held' || pointerId !== this.pointerId) return;
    this.recordSample(x, y, time, bounds);
  }

  release(pointerId: number, x: number, y: number, time: number, bounds: FetchBounds): boolean {
    if (!this.current || this.current.phase !== 'held' || pointerId !== this.pointerId) return false;
    this.recordSample(x, y, time, bounds);
    const distance = Math.hypot(x - this.dragOrigin.x, y - this.dragOrigin.y);
    this.pointerId = null;

    if (distance < THROW_DISTANCE_THRESHOLD) {
      this.current.phase = 'ready';
      this.current.vx = 0;
      this.current.vy = 0;
      this.samples = [];
      return false;
    }

    const velocity = this.releaseVelocity();
    this.current.phase = 'thrown';
    this.current.vx = velocity.x;
    this.current.vy = velocity.y;
    this.current.hasBounced = false;
    this.phaseElapsed = 0;
    this.samples = [];
    return true;
  }

  cancelDrag(pointerId?: number): void {
    if (!this.current || this.current.phase !== 'held') return;
    if (pointerId !== undefined && pointerId !== this.pointerId) return;
    this.current.phase = 'ready';
    this.current.vx = 0;
    this.current.vy = 0;
    this.pointerId = null;
    this.samples = [];
  }

  step(
    dt: number,
    bounds: FetchBounds,
    pet: FetchPetSnapshot,
    pointer: FetchPointer,
  ): FetchIntent | null {
    if (!this.current) return null;
    this.keepInBounds(bounds);

    if (this.current.phase === 'thrown') {
      this.updatePhysics(dt, bounds);
      if (this.current.hasBounced && this.distanceFromPet(pet) <= PICKUP_DISTANCE) {
        this.enterPhase('pickup');
      }
    } else if (this.current.phase === 'pickup') {
      this.phaseElapsed += dt;
      if (this.phaseElapsed >= PICKUP_DURATION) this.enterPhase('carried');
    } else if (this.current.phase === 'carried') {
      if (this.distanceFromPointer(pet, pointer) <= DELIVERY_DISTANCE) {
        this.enterPhase('delivery');
      }
    } else if (this.current.phase === 'delivery') {
      this.phaseElapsed += dt;
      if (this.phaseElapsed >= DELIVERY_DURATION) {
        this.placeBesidePointer(bounds, pet, pointer);
        return null;
      }
    }

    return this.intentForCurrentPhase(pet, pointer);
  }

  private intentForCurrentPhase(
    pet: FetchPetSnapshot,
    pointer: FetchPointer,
  ): FetchIntent | null {
    switch (this.current?.phase) {
      case 'thrown':
        return {
          mode: 'chase',
          targetX: this.current.x - pet.width / 2,
          targetY: this.current.y + 22,
          speed: 120 + pet.personality.speed * 2,
        };
      case 'pickup':
        return { mode: 'pickup' };
      case 'carried':
        return {
          mode: 'carry',
          targetX: pointer.x - pet.width / 2,
          targetY: pointer.y + 22,
          speed: 120 + pet.personality.speed * 2,
        };
      case 'delivery':
        return { mode: 'deliver' };
      default:
        return null;
    }
  }

  private updatePhysics(dt: number, bounds: FetchBounds): void {
    const ball = this.current!;
    const floor = Math.max(BALL_RADIUS, bounds.floorY - BALL_RADIUS);
    const grounded = ball.y >= floor - .01 && ball.vy === 0;

    if (grounded) {
      ball.vx = approachZero(ball.vx, ROLLING_FRICTION * dt);
    } else {
      ball.vy += GRAVITY * dt;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.rotation += ball.vx * dt * .3;

    if (ball.x < BALL_RADIUS) {
      ball.x = BALL_RADIUS;
      ball.vx = Math.abs(ball.vx) * WALL_RESTITUTION;
    } else if (ball.x > bounds.width - BALL_RADIUS) {
      ball.x = Math.max(BALL_RADIUS, bounds.width - BALL_RADIUS);
      ball.vx = -Math.abs(ball.vx) * WALL_RESTITUTION;
    }

    if (ball.y < BALL_RADIUS) {
      ball.y = BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * WALL_RESTITUTION;
    }

    if (ball.y >= floor && ball.vy >= 0) {
      ball.y = floor;
      ball.hasBounced = true;
      ball.vx *= .86;
      ball.vy = Math.abs(ball.vy) < 70 ? 0 : -ball.vy * FLOOR_RESTITUTION;
    }
  }

  private keepInBounds(bounds: FetchBounds): void {
    if (!this.current) return;
    this.current.x = clamp(this.current.x, BALL_RADIUS, Math.max(BALL_RADIUS, bounds.width - BALL_RADIUS));
    this.current.y = clamp(this.current.y, BALL_RADIUS, Math.max(BALL_RADIUS, bounds.floorY - BALL_RADIUS));
  }

  private placeBesidePointer(
    bounds: FetchBounds,
    pet: FetchPetSnapshot,
    pointer: FetchPointer,
  ): void {
    const ball = this.current!;
    const petCenterX = pet.x + pet.width / 2;
    const side = petCenterX <= pointer.x ? 1 : -1;
    ball.x = clamp(
      pointer.x + side * (BALL_RADIUS + 16),
      BALL_RADIUS,
      Math.max(BALL_RADIUS, bounds.width - BALL_RADIUS),
    );
    ball.y = clamp(
      pointer.y,
      BALL_RADIUS,
      Math.max(BALL_RADIUS, bounds.floorY - BALL_RADIUS),
    );
    ball.vx = 0;
    ball.vy = 0;
    ball.phase = 'ready';
    ball.hasBounced = false;
    this.phaseElapsed = 0;
  }

  private enterPhase(phase: BallPhase): void {
    if (!this.current) return;
    this.current.phase = phase;
    this.current.vx = 0;
    this.current.vy = 0;
    this.phaseElapsed = 0;
  }

  private distanceFromPet(pet: FetchPetSnapshot): number {
    const petCenterX = pet.x + pet.width / 2;
    const petCenterY = pet.y - 22;
    return Math.hypot(this.current!.x - petCenterX, this.current!.y - petCenterY);
  }

  private distanceFromPointer(pet: FetchPetSnapshot, pointer: FetchPointer): number {
    const petCenterX = pet.x + pet.width / 2;
    const petCenterY = pet.y - 22;
    return Math.hypot(pointer.x - petCenterX, pointer.y - petCenterY);
  }

  private recordSample(x: number, y: number, time: number, bounds: FetchBounds): void {
    const ball = this.current!;
    ball.x = clamp(x, BALL_RADIUS, Math.max(BALL_RADIUS, bounds.width - BALL_RADIUS));
    ball.y = clamp(y, BALL_RADIUS, Math.max(BALL_RADIUS, bounds.floorY - BALL_RADIUS));
    this.samples.push({ x: ball.x, y: ball.y, time });
    const cutoff = time - THROW_SAMPLE_MS;
    while (this.samples.length > 2 && this.samples[1].time < cutoff) this.samples.shift();
  }

  private releaseVelocity(): { x: number; y: number } {
    if (this.samples.length < 2) return { x: 0, y: 0 };
    const last = this.samples[this.samples.length - 1];
    const first = this.samples.find((sample) => sample.time >= last.time - THROW_SAMPLE_MS) ??
      this.samples[0];
    const seconds = Math.max(.001, (last.time - first.time) / 1000);
    let x = (last.x - first.x) / seconds;
    let y = (last.y - first.y) / seconds;
    const speed = Math.hypot(x, y);
    if (speed > MAX_THROW_SPEED) {
      const scale = MAX_THROW_SPEED / speed;
      x *= scale;
      y *= scale;
    }
    return { x, y };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function approachZero(value: number, amount: number): number {
  if (value > 0) return Math.max(0, value - amount);
  if (value < 0) return Math.min(0, value + amount);
  return 0;
}
