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
      <button #ballButton class="ball-button" type="button" aria-label="Drag ball to pet" title="Drag the ball onto the pet">⚽</button>
      <button #foodButton class="pet-item food-button" type="button" aria-label="Drag food to pet" title="Drag food onto the pet">🍖</button>
      <button #brushButton class="pet-item brush-button" type="button" aria-label="Drag brush to pet" title="Groom the pet">🪮</button>
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
        border: 1px solid rgba(120, 60, 30, .8);
        border-radius: 50%;
        background: radial-gradient(circle at 32% 28%, #fff 0 15%, #ffcf4a 16% 48%, #e44b3a 49% 100%);
        color: #55301d;
        font-size: 13px;
        box-shadow: 0 2px 5px rgba(0,0,0,.45);
        cursor: pointer;
        opacity: 0;
        pointer-events: auto;
        transition: opacity .15s ease, transform .15s ease;
      }
      .pet-root:hover .ball-button { opacity: 1; }
      .ball-button:hover { transform: scale(1.12); }
      .pet-item {
        position: absolute;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--theme-panel-opaque);
        cursor: grab;
        pointer-events: auto;
        font-size: 15px;
        opacity: .9;
        box-shadow: 0 2px 5px rgba(0,0,0,.35);
        transition: transform .15s ease;
      }
      .pet-item:active { cursor: grabbing; transform: scale(1.12); }
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
  private readonly foodButtonRef = viewChild.required<ElementRef<HTMLButtonElement>>('foodButton');
  private readonly brushButtonRef = viewChild.required<ElementRef<HTMLButtonElement>>('brushButton');

  private pet: Pet | null = null;
  private raf = 0;
  private prev = 0;
  private readonly pointer = { x: 0, y: 0, last: -1e9 };
  private lastSprite = '';
  private lastSpriteClass = '';
  private lastBubble = '';
  private dragging = false;
  private dragArmed = false;
  private movedDuringDrag = false;
  private dragStart = { x: 0, y: 0 };
  private dragOffset = { x: 0, y: 0 };
  private ball: { x: number; y: number; phase: 'idle' | 'held' | 'kick'; elapsed: number; vx: number; vy: number } | null = null;
  private ballOrbitTime = 0;
  private draggingBall = false;
  private draggedItem: { kind: 'food' | 'brush'; x: number; y: number } | null = null;

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
      this.dragArmed = true;
      this.dragging = false;
      this.movedDuringDrag = false;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      visual.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!this.dragArmed || !this.pet) return;
      if (!this.dragging && Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y) > 6) {
        this.dragging = true;
        this.movedDuringDrag = true;
        this.pet.setHeld(true);
      }
      if (!this.dragging) return;
      this.pet.x = e.clientX - this.dragOffset.x;
      this.pet.y = e.clientY - this.dragOffset.y + PET_SIZE;
    };
    const onPointerUp = () => {
      if (!this.dragArmed || !this.pet) return;
      const wasDragging = this.dragging;
      this.dragArmed = false;
      this.dragging = false;
      if (wasDragging) {
        this.pet.setHeld(false);
        this.suppressClick = true;
        window.setTimeout(() => (this.suppressClick = false), 0);
      }
    };
    visual.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    const ballButton = this.ballButtonRef().nativeElement;
    const onBallDown = (e: PointerEvent) => {
      if (e.button !== 0 || !this.ball) return;
      this.draggingBall = true;
      this.ball.phase = 'held';
      e.preventDefault();
      e.stopPropagation();
    };
    const onBallMove = (e: PointerEvent) => {
      if (!this.draggingBall || !this.ball) return;
      this.ball.x = e.clientX;
      this.ball.y = e.clientY;
    };
    const onBallUp = () => {
      if (!this.draggingBall || !this.ball) return;
      this.draggingBall = false;
      const petCenter = { x: (this.pet?.x ?? 0) + (this.pet?.width ?? 0) / 2, y: (this.pet?.y ?? 0) - 22 };
      const hit = Math.hypot(this.ball.x - petCenter.x, this.ball.y - petCenter.y) < 70;
      if (hit && this.pet) {
        this.ball.x = petCenter.x;
        this.ball.y = petCenter.y;
        this.ball.phase = 'kick';
        this.ball.elapsed = 0;
        const dx = this.ball.x - petCenter.x;
        const dy = this.ball.y - petCenter.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        this.ball.vx = dx / length * 190;
        this.ball.vy = dy / length * 190 - 35;
        this.pet.kick();
      } else {
        this.ball.phase = 'idle';
      }
    };
    ballButton.addEventListener('pointerdown', onBallDown);
    window.addEventListener('pointermove', onBallMove);
    window.addEventListener('pointerup', onBallUp);
    const itemButtons = [
      { kind: 'food' as const, element: this.foodButtonRef().nativeElement },
      { kind: 'brush' as const, element: this.brushButtonRef().nativeElement },
    ];
    const itemDown = (kind: 'food' | 'brush') => (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.draggedItem = { kind, x: e.clientX, y: e.clientY };
      e.preventDefault();
      e.stopPropagation();
    };
    const itemMove = (e: PointerEvent) => {
      if (this.draggedItem) { this.draggedItem.x = e.clientX; this.draggedItem.y = e.clientY; }
    };
    const itemUp = () => {
      if (!this.draggedItem) return;
      const item = this.draggedItem;
      this.draggedItem = null;
      const centerX = (this.pet?.x ?? 0) + (this.pet?.width ?? 0) / 2;
      const centerY = (this.pet?.y ?? 0) - 22;
      if (this.pet && Math.hypot(item.x - centerX, item.y - centerY) < 70) {
        if (item.kind === 'food') { this.mood.feed(); this.pet.feed(); }
        else this.pet.poke();
      }
    };
    for (const item of itemButtons) item.element.addEventListener('pointerdown', itemDown(item.kind));
    window.addEventListener('pointermove', itemMove);
    window.addEventListener('pointerup', itemUp);

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
      ballButton.removeEventListener('pointerdown', onBallDown);
      window.removeEventListener('pointermove', onBallMove);
      window.removeEventListener('pointerup', onBallUp);
      window.removeEventListener('pointermove', itemMove);
      window.removeEventListener('pointerup', itemUp);
    });
  }

  /** Clicking the pet feeds it: refill energy + play a happy reaction. */
  onClick(): void {
    if (this.suppressClick) return;
    this.mood.feed();
    this.pet?.feed();
  }

  private suppressClick = false;

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
    this.updateBall(dt);
    this.updateFloatingItems(t);
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
    const ballEl = this.ballButtonRef().nativeElement;
    if (!this.pet) { ballEl.style.opacity = '0'; return; }
    if (!this.ball) this.ball = { x: 0, y: 0, phase: 'idle', elapsed: 0, vx: 0, vy: 0 };
    const b = this.ball;
    this.ballOrbitTime += dt;
    if (b.phase === 'kick') {
      b.elapsed += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 180 * dt;
      if (b.elapsed > .7) b.phase = 'idle';
    } else if (b.phase === 'idle' && !this.draggingBall) {
      const angle = this.ballOrbitTime * .85 + .6;
      b.x = this.pet.x + this.pet.width / 2 + Math.cos(angle) * 76;
      b.y = this.pet.y - 22 + Math.sin(angle) * 34;
    }
    ballEl.style.opacity = '1';
    ballEl.style.left = `${b.x - this.pet.x - 12}px`;
    ballEl.style.top = `${b.y - this.pet.y - 12}px`;
  }

  private updateFloatingItems(now: number): void {
    if (!this.pet || this.draggedItem) {
      if (this.draggedItem) {
        const localX = this.draggedItem.x - this.pet!.x - 12;
        const localY = this.draggedItem.y - this.pet!.y - 12;
        const button = this.draggedItem.kind === 'food'
          ? this.foodButtonRef().nativeElement
          : this.brushButtonRef().nativeElement;
        button.style.left = `${localX}px`;
        button.style.top = `${localY}px`;
      }
      return;
    }
    const phase = now / 1000;
    const items = [
      { element: this.foodButtonRef().nativeElement, angle: phase * .8 + 2.1, radius: 74 },
      { element: this.brushButtonRef().nativeElement, angle: phase * .65 + 4.2, radius: 82 },
    ];
    for (const item of items) {
      item.element.style.left = `${this.pet.width / 2 + Math.cos(item.angle) * item.radius - 12}px`;
      item.element.style.top = `${-22 + Math.sin(item.angle) * item.radius * .5 - 12}px`;
    }
  }
}
