import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

/** Follow the actual display orientation, including a monitor rotated while running. */
@Injectable({ providedIn: 'root' })
export class DisplayService {
  readonly viewport = signal({ width: window.innerWidth, height: window.innerHeight });
  readonly portrait = computed(() => this.viewport().height > this.viewport().width);
  readonly columns = computed(() => this.viewport().width < 600 ? 1 : 2);

  constructor() {
    const resize = () => this.viewport.set({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', resize));
  }

  /** Shared with the board CSS: room for the top controls and the pet's floor. */
  cellSize(count: number): { width: number; height: number } {
    const { width, height } = this.viewport();
    const columns = this.columns();
    const rows = Math.max(1, Math.ceil(count / columns));
    const gap = Math.max(16, Math.min(32, width * 0.03));
    const floor = Math.max(120, Math.min(220, height * 0.1));
    return {
      width: (width * 0.9 - gap * (columns - 1)) / columns,
      height: Math.max(columns === 1 ? 360 : Math.min(360, width * 0.45),
        (height - 120 - floor - gap * (rows - 1)) / rows),
    };
  }
}
