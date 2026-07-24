export interface AimPoint {
  x: number;
  y: number;
}

/** Fair light-gun handicap: stable per-wave parallax plus visible lag and sway. */
export class DuckHuntAim {
  private rawX = 0;
  private rawY = 0;
  private scopeX = 0;
  private scopeY = 0;
  private offsetX = 0;
  private offsetY = 0;
  private phase = 0;
  private width = 1;
  private height = 1;
  private hasPointer = false;

  setBounds(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    if (!this.hasPointer) {
      this.rawX = this.scopeX = this.width / 2;
      this.rawY = this.scopeY = this.height / 2;
    }
    this.clampScope();
  }

  setRawPointer(x: number, y: number): void {
    this.rawX = x;
    this.rawY = y;
    if (!this.hasPointer) {
      this.scopeX = x;
      this.scopeY = y;
      this.hasPointer = true;
    }
  }

  beginWave(round: number, random: () => number = Math.random): void {
    const magnitude = Math.min(105, 45 + Math.max(0, round - 1) * 4 + random() * 20);
    const angle = random() * Math.PI * 2;
    this.offsetX = Math.cos(angle) * magnitude;
    this.offsetY = Math.sin(angle) * magnitude;
    this.phase = random() * Math.PI * 2;
  }

  update(dt: number, elapsed: number, round: number): void {
    if (dt <= 0) return;
    // Sway wobbles the scope more each round; the follow lag also grows so the
    // scope trails the mouse — both make holding a small target genuinely hard.
    const sway = Math.min(24, 6 + Math.max(0, round - 1) * 1.8);
    const targetX = this.rawX + this.offsetX + Math.sin(elapsed * 1.9 + this.phase) * sway;
    const targetY = this.rawY + this.offsetY + Math.cos(elapsed * 1.5 + this.phase * 1.31) * sway * .8;
    const followRate = Math.max(4.5, 9 - Math.max(0, round - 1) * 0.5);
    const follow = 1 - Math.exp(-dt * followRate);
    this.scopeX += (targetX - this.scopeX) * follow;
    this.scopeY += (targetY - this.scopeY) * follow;
    this.clampScope();
  }

  point(): AimPoint {
    return { x: this.scopeX, y: this.scopeY };
  }

  rawPoint(): AimPoint {
    return { x: this.rawX, y: this.rawY };
  }

  waveOffset(): AimPoint {
    return { x: this.offsetX, y: this.offsetY };
  }

  private clampScope(): void {
    const margin = 24;
    this.scopeX = Math.max(margin, Math.min(this.width - margin, this.scopeX));
    this.scopeY = Math.max(margin, Math.min(this.height - margin, this.scopeY));
  }
}

