import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A botanical corner ornament — a winding vine with leaves and a small flower.
 * Draws in `currentColor`, so the parent tints it (per-widget accent). Place four
 * of these at the card corners with rotations to frame the widget in flowers.
 */
@Component({
  selector: 'app-corner-flourish',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 72 72" fill="none" class="h-full w-full">
      <!-- main vine hugging the corner -->
      <path d="M4 44 C 4 20, 20 4, 44 4" stroke="currentColor" stroke-width="1.3" opacity="0.85" />
      <!-- inner curl -->
      <path d="M13 33 C 11 23, 17 15, 27 12" stroke="currentColor" stroke-width="0.8" opacity="0.5" />
      <!-- leaves -->
      <path d="M17 22 q -9 -1 -13 -10 q 9 1 13 10 z" fill="currentColor" stroke="none" opacity="0.5" />
      <path d="M31 12 q 1 -9 10 -13 q -1 9 -10 13 z" fill="currentColor" stroke="none" opacity="0.5" />
      <!-- flower at the vine tip -->
      <g fill="currentColor" stroke="none" opacity="0.9">
        <circle cx="46" cy="7" r="1.5" opacity="1" />
        <circle cx="46" cy="3.4" r="1.8" />
        <circle cx="49.4" cy="6" r="1.8" />
        <circle cx="48.1" cy="9.8" r="1.8" />
        <circle cx="43.9" cy="9.8" r="1.8" />
        <circle cx="42.6" cy="6" r="1.8" />
      </g>
      <!-- little bud on the other arm -->
      <circle cx="7" cy="46" r="1.6" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  `,
  styles: [`:host { display: block; }`],
})
export class CornerFlourish {}
