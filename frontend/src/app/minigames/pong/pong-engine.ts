export const COURT_WIDTH = 1000;
export const COURT_HEIGHT = 600;
export const PADDLE_WIDTH = 16;
export const PADDLE_INSET = 36;
export const BALL_RADIUS = 9;
export const WINNING_SCORE = 7;

export const PONG_MODES = {
  easy: { label: 'Easy', playerHeight: 160, aiHeight: 105, aiSpeed: 240, ballSpeed: 360, maxSpeed: 650 },
  normal: { label: 'Normal', playerHeight: 135, aiHeight: 125, aiSpeed: 330, ballSpeed: 430, maxSpeed: 780 },
  hard: { label: 'Hard', playerHeight: 115, aiHeight: 145, aiSpeed: 410, ballSpeed: 510, maxSpeed: 920 },
} as const;
export type PongDifficulty = keyof typeof PONG_MODES;
export type PongCue = 'bounce' | 'wall' | 'player-point' | 'ai-point' | 'win' | 'lose';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const moveTowards = (from: number, to: number, distance: number) => from + clamp(to - from, -distance, distance);

/** Fixed-size court: rendering/input rotate in portrait, physics stay the same. */
export class PongEngine {
  readonly mode;
  playerY = COURT_HEIGHT / 2;
  aiY = COURT_HEIGHT / 2;
  ball = { x: COURT_WIDTH / 2, y: COURT_HEIGHT / 2, vx: 0, vy: 0 };
  playerScore = 0;
  aiScore = 0;
  rally = 0;
  bestRally = 0;
  serveRemaining = .9;
  over = false;
  private serveDirection = -1;
  private aiTarget = COURT_HEIGHT / 2;
  private aiThink = 0;

  constructor(difficulty: PongDifficulty = 'easy') { this.mode = PONG_MODES[difficulty]; }

  /** One short simulation step; returns only events that need UI/audio work. */
  step(dt: number, playerTarget: number): PongCue | null {
    if (this.over || !Number.isFinite(dt) || dt <= 0) return null;
    // Bound individual steps even if a caller loses a frame, avoiding tunnelling.
    dt = Math.min(dt, 1 / 120);
    if (Number.isFinite(playerTarget)) {
      this.playerY = moveTowards(this.playerY,
        clamp(playerTarget, this.mode.playerHeight / 2, COURT_HEIGHT - this.mode.playerHeight / 2), 1200 * dt);
    }
    this.aiThink -= dt;
    if (this.aiThink <= 0) {
      this.aiThink = .12;
      this.aiTarget = this.ball.vx > 0 ? this.ball.y : COURT_HEIGHT / 2;
    }
    this.aiY = clamp(moveTowards(this.aiY, this.aiTarget, this.mode.aiSpeed * dt),
      this.mode.aiHeight / 2, COURT_HEIGHT - this.mode.aiHeight / 2);

    if (this.serveRemaining > 0) {
      this.serveRemaining = Math.max(0, this.serveRemaining - dt);
      if (this.serveRemaining === 0) {
        this.ball.vx = this.serveDirection * this.mode.ballSpeed * .94;
        this.ball.vy = this.mode.ballSpeed * .34 * (this.playerScore % 2 ? -1 : 1);
      }
      return null;
    }

    const previousX = this.ball.x;
    const previousY = this.ball.y;
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    let cue: PongCue | null = null;
    if (this.ball.y < BALL_RADIUS || this.ball.y > COURT_HEIGHT - BALL_RADIUS) {
      this.ball.y = clamp(this.ball.y < BALL_RADIUS ? 2 * BALL_RADIUS - this.ball.y
        : 2 * (COURT_HEIGHT - BALL_RADIUS) - this.ball.y, BALL_RADIUS, COURT_HEIGHT - BALL_RADIUS);
      this.ball.vy *= -1;
      cue = 'wall';
    }

    const left = PADDLE_INSET + PADDLE_WIDTH + BALL_RADIUS;
    const right = COURT_WIDTH - left;
    if (this.ball.vx < 0 && previousX >= left && this.ball.x <= left) {
      const y = previousY + (this.ball.y - previousY) * (previousX - left) / (previousX - this.ball.x);
      if (Math.abs(y - this.playerY) <= this.mode.playerHeight / 2 + BALL_RADIUS) {
        this.bounce(left, y, this.playerY, this.mode.playerHeight, 1);
        cue = 'bounce';
      }
    } else if (this.ball.vx > 0 && previousX <= right && this.ball.x >= right) {
      const y = previousY + (this.ball.y - previousY) * (right - previousX) / (this.ball.x - previousX);
      if (Math.abs(y - this.aiY) <= this.mode.aiHeight / 2 + BALL_RADIUS) {
        this.bounce(right, y, this.aiY, this.mode.aiHeight, -1);
        cue = 'bounce';
      }
    }

    if (this.ball.x < -BALL_RADIUS || this.ball.x > COURT_WIDTH + BALL_RADIUS) {
      const playerPoint = this.ball.x > COURT_WIDTH;
      if (playerPoint) this.playerScore++;
      else this.aiScore++;
      this.over = this.playerScore >= WINNING_SCORE || this.aiScore >= WINNING_SCORE;
      this.rally = 0;
      this.serveDirection = playerPoint ? 1 : -1;
      this.ball = { x: COURT_WIDTH / 2, y: COURT_HEIGHT / 2, vx: 0, vy: 0 };
      this.serveRemaining = .9;
      return this.over ? (playerPoint ? 'win' : 'lose') : (playerPoint ? 'player-point' : 'ai-point');
    }
    return cue;
  }

  private bounce(x: number, y: number, centre: number, height: number, direction: number): void {
    const angle = clamp((y - centre) / (height / 2), -.95, .95) * Math.PI / 3;
    const speed = Math.min(this.mode.maxSpeed, Math.hypot(this.ball.vx, this.ball.vy) * 1.055);
    this.ball = { x, y: clamp(y, BALL_RADIUS, COURT_HEIGHT - BALL_RADIUS),
      vx: direction * speed * Math.cos(angle), vy: speed * Math.sin(angle) };
    this.rally++;
    this.bestRally = Math.max(this.bestRally, this.rally);
  }
}
