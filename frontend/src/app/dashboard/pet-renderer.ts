import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { PetService } from './pet.service';
import { createPet, Pet } from './pets';
import { PetContext } from './pets/pet-types';

/**
 * Thin view layer for the pet domain: builds the current Pet from the selected
 * id, ticks its state machine every frame with a fresh PetContext, and paints
 * the resulting PetView straight onto the DOM (no per-frame change detection).
 * All behaviour/animation lives in the `pets/` classes.
 */
@Component({
  selector: 'app-pet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #root class="pet-root">
      <span #thread class="thread"></span>
      <span #bubble class="bubble"></span>
      <span #emoji class="emoji" (click)="poke()"></span>
    </div>
  `,
  styles: [
    `
      .pet-root {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 40;
        will-change: transform;
        pointer-events: none;
      }
      .emoji {
        position: absolute;
        left: 0;
        top: 0;
        font-size: 38px;
        line-height: 1;
        user-select: none;
        cursor: pointer;
        pointer-events: auto;
        display: inline-block;
        transform-origin: 50% 90%;
        filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5));
      }
      .thread {
        position: absolute;
        left: 18px;
        top: 6px;
        width: 1px;
        height: 0;
        background: rgba(230, 224, 205, 0.5);
        transform: translateY(-100%);
      }
      .bubble {
        position: absolute;
        left: 30px;
        top: -8px;
        font-size: 15px;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
    `,
  ],
})
export class PetRenderer implements AfterViewInit {
  private readonly pets = inject(PetService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly rootRef = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly emojiRef = viewChild.required<ElementRef<HTMLElement>>('emoji');
  private readonly threadRef = viewChild.required<ElementRef<HTMLElement>>('thread');
  private readonly bubbleRef = viewChild.required<ElementRef<HTMLElement>>('bubble');

  private pet: Pet | null = null;
  private raf = 0;
  private prev = 0;
  private readonly pointer = { x: 0, y: 0, last: -1e9 };
  private lastEmoji = '';
  private lastBubble = '';

  constructor() {
    // Rebuild the pet instance whenever the selection changes.
    effect(() => {
      const id = this.pets.petId();
      this.pet = id ? createPet(id) : null;
    });
  }

  ngAfterViewInit(): void {
    const onMove = (e: MouseEvent) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.last = performance.now();
    };
    window.addEventListener('mousemove', onMove);

    const loop = (t: number) => {
      this.frame(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.raf);
      window.removeEventListener('mousemove', onMove);
    });
  }

  poke(): void {
    this.pet?.poke();
  }

  private frame(t: number): void {
    const root = this.rootRef().nativeElement;
    if (!this.pet) {
      root.style.display = 'none';
      this.prev = 0;
      return;
    }
    root.style.display = 'block';

    const dt = this.prev ? Math.min((t - this.prev) / 1000, 0.05) : 0;
    this.prev = t;

    const ctx: PetContext = {
      now: t,
      dt,
      width: window.innerWidth,
      height: window.innerHeight,
      floorY: window.innerHeight - 64,
      pointer: {
        x: this.pointer.x,
        y: this.pointer.y,
        active: performance.now() - this.pointer.last < 4000,
      },
    };

    this.pet.update(ctx);
    const v = this.pet.view();

    root.style.transform = `translate(${v.x}px, ${v.y}px)`;

    const em = this.emojiRef().nativeElement;
    em.style.transform = v.innerTransform;
    if (v.emoji !== this.lastEmoji) {
      em.textContent = v.emoji;
      this.lastEmoji = v.emoji;
    }

    this.threadRef().nativeElement.style.height = `${v.thread ?? 0}px`;

    const bubbleText = v.bubble ?? '';
    if (bubbleText !== this.lastBubble) {
      const bu = this.bubbleRef().nativeElement;
      bu.textContent = bubbleText;
      bu.style.opacity = bubbleText ? '1' : '0';
      this.lastBubble = bubbleText;
    }
  }
}
