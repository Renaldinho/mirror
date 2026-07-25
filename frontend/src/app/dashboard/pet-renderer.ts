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
      <button #ballButton class="ball-button" type="button" aria-label="Toss a ball" title="Toss a ball">⚽</button>
      <span #ball class="pet-ball" aria-hidden="true"></span>
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
        touch-action: none;
      }
      .ball-button {
        position: absolute;
        left: 50px;
        top: -25px;
        width: 24px;
        height: 24px;
        border: 1px solid var(--theme-border);
        border-radius: 50%;
        background: var(--theme-panel-opaque);
        color: var(--theme-text);
        cursor: pointer;
        opacity: 0;
        pointer-events: auto;
        transition: opacity .15s ease, transform .15s ease;
      }
      .pet-root:hover .ball-button { opacity: 1; }
      .ball-button:hover { transform: scale(1.12); }
      .pet-ball {
        position: absolute;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: radial-gradient(circle at 32% 28%, #fff 0 15%, #ffcf4a 16% 48%, #e44b3a 49% 100%);
        box-shadow: 0 2px 5px rgba(0,0,0,.45);
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -50%);
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
  private readonly ballButtonRef = viewChild.required<ElementRef<HTMLButtonElement>>('ballButton');
  private readonly ballRef = viewChild.required<ElementRef<HTMLElement>>('ball');

  private pet: Pet | null = null;
  private raf = 0;
  private prev = 0;
  private readonly pointer = { x: 0, y: 0, last: -1e9 };
  private lastSprite = '';
  private lastSpriteClass = '';
  private lastBubble = '';
  private dragging = false;
  private movedDuringDrag = false;
  private dragOffset = { x: 0, y: 0 };
  private ball: { x: number; y: number; targetX: number; targetY: number; phase: 'out' | 'in' | 'kick'; elapsed: number } | null = null;

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
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || !this.pet) return;
      const rect = visual.getBoundingClientRect();
      this.dragging = true;
      this.movedDuringDrag = false;
      this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      visual.setPointerCapture?.(e.pointerId);
      this.pet.setHeld(true);
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!this.dragging || !this.pet) return;
      if (Math.hypot(e.movementX, e.movementY) > 1) this.movedDuringDrag = true;
      this.pet.x = e.clientX - this.dragOffset.x;
      this.pet.y = e.clientY - this.dragOffset.y + PET_SIZE;
    };
    const onPointerUp = () => {
      if (!this.dragging || !this.pet) return;
      this.dragging = false;
      this.pet.setHeld(false);
      if (this.movedDuringDrag) {
        this.suppressClick = true;
        window.setTimeout(() => (this.suppressClick = false), 0);
      }
    };
    visual.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    const ballButton = this.ballButtonRef().nativeElement;
    const toss = (e: Event) => { e.stopPropagation(); this.tossBall(); };
    ballButton.addEventListener('click', toss);

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
      visual.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      ballButton.removeEventListener('click', toss);
    });
  }

  /** Clicking the pet feeds it: refill energy + play a happy reaction. */
  onClick(): void {
    if (this.suppressClick) return;
    this.mood.feed();
    this.pet?.feed();
  }

  private suppressClick = false;

  private tossBall(): void {
    if (!this.pet || this.ball) return;
    const startX = this.pet.x + this.pet.width * .5;
    const startY = this.pet.y - 22;
    const targetX = Math.max(24, Math.min(window.innerWidth - 24, startX + (this.pointer.x > startX ? 150 : -150)));
    const targetY = Math.max(80, Math.min(window.innerHeight - 110, startY - 40));
    this.ball = { x: startX, y: startY, targetX, targetY, phase: 'out', elapsed: 0 };
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

    if (!this.dragging) this.pet.update(ctx);
    else this.pet.setHeld(true);
    this.updateBall(dt);
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

  private updateBall(dt: number): void {
    const ballEl = this.ballRef().nativeElement;
    if (!this.ball || !this.pet) {
      ballEl.style.opacity = '0';
      return;
    }
    const b = this.ball;
    b.elapsed += dt;
    const progress = Math.min(1, b.elapsed / .6);
    if (b.phase === 'out') {
      b.x = this.pet.x + this.pet.width * .5 + (b.targetX - (this.pet.x + this.pet.width * .5)) * progress;
      b.y = this.pet.y - 22 + (b.targetY - (this.pet.y - 22)) * progress - Math.sin(progress * Math.PI) * 50;
      if (progress >= 1) { b.phase = 'in'; b.elapsed = 0; }
    } else if (b.phase === 'in') {
      const endX = this.pet.x + this.pet.width * .5;
      const endY = this.pet.y - 22;
      b.x = b.targetX + (endX - b.targetX) * progress;
      b.y = b.targetY + (endY - b.targetY) * progress - Math.sin(progress * Math.PI) * 35;
      if (progress >= 1) { b.phase = 'kick'; b.elapsed = 0; this.pet.kick(); }
    } else {
      b.x += 190 * dt;
      b.y -= 45 * dt;
      if (b.elapsed > .7) this.ball = null;
    }
    if (this.ball) {
      ballEl.style.opacity = '1';
      ballEl.style.left = `${b.x - this.pet.x}px`;
      ballEl.style.top = `${b.y - this.pet.y}px`;
    }
  }
}
