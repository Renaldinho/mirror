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
import { SettingsService } from './settings.service';
import { createPet, Pet } from './pets';
import { PetMoodService } from './pets/pet-mood.service';
import { PET_SIZE } from './pets/pet-state';
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
      <span #bubble class="bubble"></span>
      <span #name class="pet-name"></span>
      <span #visual class="visual" (click)="onClick()"></span>
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
      .visual {
        position: absolute;
        left: 0;
        top: 0;
        width: 44px;
        height: 44px;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        user-select: none;
        cursor: pointer;
        pointer-events: auto;
        display: inline-block;
        transform-origin: 50% 100%;
        filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5));
      }
      .bubble {
        position: absolute;
        left: 30px;
        top: -8px;
        font-size: 15px;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .pet-name {
        position: absolute;
        left: 50%;
        top: -20px;
        transform: translateX(-50%);
        padding: 1px 7px;
        border-radius: 999px;
        border: 1px solid var(--theme-border);
        background: var(--theme-panel-opaque);
        color: var(--theme-text);
        font: 600 10px/1.4 var(--theme-font-body);
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
      }
    `,
  ],
})
export class PetRenderer implements AfterViewInit {
  private readonly pets = inject(PetService);
  private readonly mood = inject(PetMoodService);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly rootRef = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly visualRef = viewChild.required<ElementRef<HTMLElement>>('visual');
  private readonly bubbleRef = viewChild.required<ElementRef<HTMLElement>>('bubble');
  private readonly nameRef = viewChild.required<ElementRef<HTMLElement>>('name');

  private pet: Pet | null = null;
  private raf = 0;
  private prev = 0;
  private readonly pointer = { x: 0, y: 0, last: -1e9 };
  private lastSprite = '';
  private lastSpriteClass = '';
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

    // Reveal the pet's name on hover.
    const visual = this.visualRef().nativeElement;
    const nameEl = this.nameRef().nativeElement;
    const showName = () => {
      const name = this.mood.name();
      nameEl.textContent = name;
      nameEl.style.opacity = name ? '1' : '0';
    };
    const hideName = () => (nameEl.style.opacity = '0');
    visual.addEventListener('mouseenter', showName);
    visual.addEventListener('mouseleave', hideName);

    const loop = (t: number) => {
      this.frame(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.raf);
      window.removeEventListener('mousemove', onMove);
      visual.removeEventListener('mouseenter', showName);
      visual.removeEventListener('mouseleave', hideName);
    });
  }

  /** Clicking the pet feeds it: refill energy + play a happy reaction. */
  onClick(): void {
    this.mood.feed();
    this.pet?.feed();
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
      energy: this.mood.energy() / 100,
      dim: !this.settings.bgOn() || this.settings.bgLight() < 25,
    };

    this.pet.update(ctx);
    const v = this.pet.view();

    root.style.transform = `translate(${v.x}px, ${v.y}px)`;

    const em = this.visualRef().nativeElement;
    em.style.transform = v.innerTransform;
    em.style.width = `${v.visualWidth}px`;
    em.style.height = `${v.visualHeight}px`;
    em.style.top = `${PET_SIZE - v.visualHeight}px`;

    const { sheet, row, column } = v.sprite;
    const spriteKey = `${sheet.cssClass}:${row}:${column}`;
    if (sheet.cssClass !== this.lastSpriteClass) {
      if (this.lastSpriteClass) em.classList.remove(this.lastSpriteClass);
      em.classList.add(sheet.cssClass);
      this.lastSpriteClass = sheet.cssClass;
    }
    if (spriteKey !== this.lastSprite) {
      em.style.backgroundSize =
        `${sheet.columns * sheet.displayWidth}px ${sheet.rows * sheet.displayHeight}px`;
      em.style.backgroundPosition =
        `${-column * sheet.displayWidth}px ${-row * sheet.displayHeight}px`;
      this.lastSprite = spriteKey;
    }

    const bubbleText = v.bubble ?? '';
    if (bubbleText !== this.lastBubble) {
      const bu = this.bubbleRef().nativeElement;
      bu.textContent = bubbleText;
      bu.style.opacity = bubbleText ? '1' : '0';
      this.lastBubble = bubbleText;
    }
    const bubble = this.bubbleRef().nativeElement;
    bubble.style.left = `${Math.max(30, v.visualWidth * 0.7)}px`;
    bubble.style.top = `${PET_SIZE - v.visualHeight - 18}px`;
  }
}
