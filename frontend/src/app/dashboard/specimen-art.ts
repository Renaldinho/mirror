import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ArtKey = 'mushroom' | 'fern' | 'bloom' | 'ivy' | 'moth';

/**
 * Hand-drawn botanical/entomological line illustrations (herbarium style),
 * drawn in `currentColor` so a parent can tint them with a widget's accent.
 * Used large + faint as a plate watermark and small + crisp as the plate emblem.
 */
@Component({
  selector: 'app-specimen-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 100 100"
      class="h-full w-full"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @switch (art()) {
        @case ('mushroom') {
          <path d="M20 45 C 22 20 78 20 80 45 C 66 54 34 54 20 45 Z" fill="currentColor" fill-opacity="0.16" />
          <path d="M40 51 C 38 74 33 84 29 91 C 43 95 57 95 71 91 C 67 84 62 74 60 51" />
          <path d="M29 91 C 42 87 58 87 71 91" />
          <path d="M33 48 v4 M42 50 v4 M50 50 v4 M58 50 v4 M67 48 v4" />
          <circle cx="40" cy="34" r="3" fill="currentColor" stroke="none" />
          <circle cx="59" cy="30" r="2.3" fill="currentColor" stroke="none" />
          <circle cx="50" cy="40" r="1.8" fill="currentColor" stroke="none" />
        }
        @case ('fern') {
          <path d="M50 94 C 49 66 50 40 50 10" />
          <path d="M50 18 C 42 14 37 17 39 24 M50 18 C 58 14 63 17 61 24" />
          <path d="M50 30 C 40 25 34 29 36 37 M50 30 C 60 25 66 29 64 37" />
          <path d="M50 44 C 38 39 31 44 33 53 M50 44 C 62 39 69 44 67 53" />
          <path d="M50 58 C 37 53 29 59 31 69 M50 58 C 63 53 71 59 69 69" />
          <path d="M50 72 C 39 68 33 73 35 81 M50 72 C 61 68 67 73 65 81" />
        }
        @case ('bloom') {
          <path d="M50 40 C 44 40 44 30 50 30 C 57 30 58 42 47 42 C 35 42 35 24 50 24 C 66 24 66 46 44 46" />
          <path d="M50 46 C 50 66 50 80 50 92" />
          <path d="M50 64 C 40 60 33 64 33 73 C 44 73 50 69 50 64 Z" fill="currentColor" fill-opacity="0.12" />
          <path d="M50 74 C 60 70 67 74 67 83 C 56 83 50 79 50 74 Z" fill="currentColor" fill-opacity="0.12" />
        }
        @case ('ivy') {
          <path d="M18 90 C 40 80 30 62 50 54 C 70 46 60 26 82 16" />
          <g fill="currentColor" fill-opacity="0.14" stroke-width="1.4">
            <path d="M34 70 c -6 -6 -2 -14 4 -12 c 6 -2 10 6 4 12 c 2 6 -6 6 -8 3 c -4 2 -6 -3 0 -3 z" />
            <path d="M52 50 c -6 -6 -2 -14 4 -12 c 6 -2 10 6 4 12 c 2 6 -6 6 -8 3 c -4 2 -6 -3 0 -3 z" />
            <path d="M70 30 c -6 -6 -2 -14 4 -12 c 6 -2 10 6 4 12 c 2 6 -6 6 -8 3 c -4 2 -6 -3 0 -3 z" />
          </g>
        }
        @case ('moth') {
          <ellipse cx="50" cy="54" rx="3.6" ry="15" fill="currentColor" fill-opacity="0.2" />
          <path d="M50 44 C 24 28 16 50 28 58 C 40 64 48 58 50 52" fill="currentColor" fill-opacity="0.1" />
          <path d="M50 44 C 76 28 84 50 72 58 C 60 64 52 58 50 52" fill="currentColor" fill-opacity="0.1" />
          <path d="M50 56 C 30 54 26 72 38 76 C 47 79 50 68 50 62" fill="currentColor" fill-opacity="0.08" />
          <path d="M50 56 C 70 54 74 72 62 76 C 53 79 50 68 50 62" fill="currentColor" fill-opacity="0.08" />
          <path d="M48 40 C 43 32 39 30 34 27 M52 40 C 57 32 61 30 66 27" />
          <circle cx="33" cy="48" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="67" cy="48" r="2.4" fill="currentColor" stroke="none" />
        }
      }
    </svg>
  `,
  styles: [`:host { display: block; }`],
})
export class SpecimenArt {
  readonly art = input.required<ArtKey>();
}
