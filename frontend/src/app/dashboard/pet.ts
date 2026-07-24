import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { PetService } from './pet.service';

/**
 * A Shimeji-style desktop pet: an emoji critter that wanders along the foot of
 * the mirror, pauses to idle, turns around at the edges, and hops when poked.
 * Position is driven straight onto the element transform via requestAnimationFrame
 * (no per-frame change detection). Which critter (or none) comes from PetService.
 */
@Component({
  selector: 'app-pet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="glyph" (click)="poke()">{{ pets.kind()?.emoji }}</span>`,
  styles: [
    `
      :host {
        position: fixed;
        left: 0;
        bottom: 12px;
        z-index: 40;
        font-size: 40px;
        line-height: 1;
        user-select: none;
        will-change: transform;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
      }
      .glyph {
        cursor: pointer;
        display: inline-block;
      }
    `,
  ],
})
export class Pet {
  readonly pets = inject(PetService);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  private x = 80;
  private dir: 1 | -1 = 1;
  private walking = true;
  private nextChange = 0;
  private hopStart = -1;
  private raf = 0;
  private readonly size = 44;
  private readonly speed = 46; // px/s
  private prev = 0;
  private readonly reduced =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  constructor() {
    const loop = (t: number) => {
      this.step(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.raf));
  }

  poke(): void {
    this.hopStart = performance.now();
  }

  private step(t: number): void {
    const dt = this.prev ? Math.min((t - this.prev) / 1000, 0.05) : 0;
    this.prev = t;

    // hidden when no pet is selected — idle the loop cheaply
    if (!this.pets.kind()) {
      this.host.style.display = 'none';
      return;
    }
    this.host.style.display = 'block';

    const maxX = Math.max(40, window.innerWidth - this.size);

    if (!this.reduced) {
      // occasional behaviour change: walk ↔ idle, maybe turn
      if (t > this.nextChange) {
        this.walking = Math.random() > 0.3;
        if (Math.random() > 0.6) this.dir = this.dir === 1 ? -1 : 1;
        this.nextChange = t + 1400 + Math.random() * 3200;
      }
      if (this.walking) {
        this.x += this.dir * this.speed * dt;
        if (this.x <= 0) { this.x = 0; this.dir = 1; }
        if (this.x >= maxX) { this.x = maxX; this.dir = -1; }
      }
    }

    // gentle walk bob
    const bob = this.walking && !this.reduced ? Math.abs(Math.sin(t * 0.012)) * 4 : 0;

    // hop on poke: a decaying arc for ~600ms
    let hop = 0;
    if (this.hopStart >= 0) {
      const p = (performance.now() - this.hopStart) / 600;
      if (p >= 1) this.hopStart = -1;
      else hop = Math.sin(p * Math.PI) * 26;
    }

    this.host.style.transform = `translate(${this.x}px, ${-(bob + hop)}px) scaleX(${this.dir})`;
  }
}
