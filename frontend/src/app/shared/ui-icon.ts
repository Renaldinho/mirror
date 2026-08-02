import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const ICON_PATHS = {
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 7v5l3 2'],
  cloud: ['M6.5 18h10a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 5.6 11 3.5 3.5 0 0 0 6.5 18Z'],
  quote: ['M5 7h5v5H7v5H4v-6a4 4 0 0 1 4-4', 'M14 7h5v5h-3v5h-3v-6a4 4 0 0 1 4-4'],
  note: ['M6 4h9l3 3v13H6Z', 'M15 4v4h3', 'M9 12h6', 'M9 16h4'],
  music: ['M9 18V6l10-2v12', 'M9 8l10-2', 'M6.5 21A2.5 2.5 0 1 0 6.5 16a2.5 2.5 0 0 0 0 5Z', 'M16.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z'],
  lyrics: ['M5 5h14', 'M5 9h10', 'M5 13h8', 'M8 20v-5l7-1v4', 'M6.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M13.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'],
  circle: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z'],
  mushroom: ['M5 11a7 7 0 0 1 14 0Z', 'M9 11v7c0 2 6 2 6 0v-7', 'M9 15h6'],
  occult: ['m12 3 2.1 6.5H21l-5.5 4 2.1 6.5-5.6-4-5.6 4 2.1-6.5-5.5-4h6.9Z', 'M12 3v13', 'M6.4 20 21 9.5', 'M3 9.5 17.6 20'],
  star: ['m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z'],
  skull: ['M6 11a6 6 0 1 1 12 0v4l-2 2v3H8v-3l-2-2Z', 'M9 11h.01', 'M15 11h.01', 'm10 16 2-2 2 2', 'M10 20v-3', 'M14 20v-3'],
  heart: ['M12 20S4 15.5 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.5 12 20 12 20Z'],
  umbrella: ['M4 12a8 8 0 0 1 16 0Z', 'M12 12v6a2 2 0 0 0 4 0'],
  rainbow: ['M4 18a8 8 0 0 1 16 0', 'M7 18a5 5 0 0 1 10 0', 'M10 18a2 2 0 0 1 4 0'],
  half: ['M12 3a9 9 0 1 0 0 18Z', 'M12 3v18'],
  moon: ['M19 15.5A8 8 0 0 1 8.5 5 8 8 0 1 0 19 15.5Z'],
  sparkle: ['M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z'],
  glitter: ['M8 4v8', 'M4 8h8', 'M17 12v8', 'M13 16h8', 'm17 4 .7 2.3L20 7l-2.3.7L17 10l-.7-2.3L14 7l2.3-.7Z'],
  matrix: ['M6 4v16', 'M10 4v16', 'M14 4v16', 'M18 4v16', 'M4 8h16', 'M4 16h16'],
  flame: ['M13 3s1 4-2 7c-2-3-5 1-5 5a6 6 0 0 0 12 0c0-5-3-7-5-12Z', 'M12 13c-2 2-2 5 0 6 2-1 3-4 0-6Z'],
  bubbles: ['M9 14a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', 'M17 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z', 'M17 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
  check: ['m5 12 4 4L19 6'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  grip: ['M8 6h.01', 'M12 6h.01', 'M16 6h.01', 'M8 12h.01', 'M12 12h.01', 'M16 12h.01', 'M8 18h.01', 'M12 18h.01', 'M16 18h.01'],
  'chevron-right': ['m9 5 7 7-7 7'],
  'chevron-down': ['m5 9 7 7 7-7'],
  layout: ['M4 5h16v14H4Z', 'M4 10h16', 'M10 10v9'],
  pin: ['m9 4 6 0-1 5 3 3v2h-4l-1 7-1-7H7v-2l3-3Z'],
  'pin-off': ['M3 3l18 18', 'm9 4 6 0-.7 3.3', 'M16 11l1 1v2h-3', 'M10 9 7 12v2h4l-1 7-1-7H8'],
  food: ['M8 8 5 5a2 2 0 1 0-2 2l3 3', 'm16 16 3 3a2 2 0 1 0 2-2l-3-3', 'M8 8c2-2 6 2 8 4s0 4-2 4-4-4-6-4Z'],
  brush: ['M14 4 20 10 10 20 4 20 4 14Z', 'm12 6 6 6', 'M4 16h6', 'M7 13v7'],
  enter: ['M4 12h13', 'm12 7 5 5-5 5', 'M20 5v7h-3'],
  duck: ['M5 16c2-5 6-6 9-4l3-1-2-2c0-3-5-3-5 1-4 0-6 2-6 5 0 3 3 5 7 5h7'],
  hammer: ['m14 5 5 5-3 3-5-5Z', 'm12 10-8 8 2 2 8-8', 'M11 4 8 7'],
  gamepad: ['M7 8h10a5 5 0 0 1 4 8l-1 2a2 2 0 0 1-3 .5L15 17H9l-2 1.5A2 2 0 0 1 4 18l-1-2a5 5 0 0 1 4-8Z', 'M8 11v4', 'M6 13h4', 'M16 12h.01', 'M18 14h.01'],
  volume: ['M4 10v4h4l5 4V6l-5 4Z', 'M16 9a4 4 0 0 1 0 6', 'M18 6a8 8 0 0 1 0 12'],
  'volume-off': ['M4 10v4h4l5 4V6l-5 4Z', 'm16 10 4 4', 'm20 10-4 4'],
  reset: ['M5 8V4l3 3', 'M5 7a8 8 0 1 1-1 8'],
  sun: ['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'm17.7 17.7 1.4 1.4', 'M2 12h2', 'M20 12h2', 'm4.9 19.1 1.4-1.4', 'm17.7 6.3 1.4-1.4'],
  'partly-cloudy': ['M8 10a4 4 0 1 1 7.5 2', 'M4 18h13a3 3 0 0 0 0-6 5 5 0 0 0-9.5 1A2.5 2.5 0 0 0 4 18Z'],
  fog: ['M5 9h14', 'M3 13h18', 'M6 17h12'],
  drizzle: ['M5 8h14', 'M7 12v1', 'M12 12v1', 'M17 12v1', 'M7 17v1', 'M12 17v1', 'M17 17v1'],
  rain: ['M5 9h14', 'm8 13-2 4', 'm6 0-2 4', 'm6-4-2 4'],
  snow: ['M12 11v10', 'm8 13 8 6', 'm16 13-8 6', 'M5 8h14'],
  storm: ['M5 9h14', 'm13 12-4 5h4l-2 4'],
} as const;

export type IconName = keyof typeof ICON_PATHS;

@Component({
  selector: 'app-ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">
      @for (path of paths(); track path) { <path [attr.d]="path" /> }
    </svg>
  `,
  styles: [`:host { display: inline-grid; width: 1em; height: 1em; place-items: center; } svg { display: block; width: 100%; height: 100%; }`],
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly paths = computed(() => ICON_PATHS[this.name()]);
}
