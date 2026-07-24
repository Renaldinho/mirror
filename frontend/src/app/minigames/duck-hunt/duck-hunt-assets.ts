import { ThemeId } from '../../dashboard/theme-registry';

export const DUCK_HUNT_ASSET_ROOT = '/games/duck-hunt';
export const ATLAS_COLUMNS = 4;
export const ATLAS_ROWS = 2;

export interface DuckHuntThemeStyle {
  background: string;
  accent: string;
  glow: string;
  spriteFilter: string;
}

export const DUCK_HUNT_THEME_STYLES: Record<ThemeId, DuckHuntThemeStyle> = {
  bare: {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/bare.webp`,
    accent: '#f0bd67',
    glow: '#d99f55',
    spriteFilter: 'sepia(.18) saturate(.92)',
  },
  mushroom: {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/mushroom.webp`,
    accent: '#e3bd72',
    glow: '#a2503b',
    spriteFilter: 'sepia(.12) saturate(.9) hue-rotate(-8deg)',
  },
  occult: {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/occult.webp`,
    accent: '#ff8a4d',
    glow: '#c31336',
    spriteFilter: 'sepia(.25) saturate(1.35) hue-rotate(320deg)',
  },
  'star-wars': {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/star-wars.webp`,
    accent: '#9ddcff',
    glow: '#dc3443',
    spriteFilter: 'saturate(.82) contrast(1.08) hue-rotate(8deg)',
  },
  warhammer: {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/warhammer.webp`,
    accent: '#d4ad61',
    glow: '#8f2726',
    spriteFilter: 'sepia(.32) saturate(.88) contrast(1.12)',
  },
  pinkie: {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/pinkie.webp`,
    accent: '#fff1fb',
    glow: '#ff69bd',
    spriteFilter: 'saturate(1.22) brightness(1.08) hue-rotate(302deg)',
  },
  emo: {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/emo.webp`,
    accent: '#e8eef0',
    glow: '#7e8990',
    spriteFilter: 'grayscale(1) contrast(1.18)',
  },
  'spooky-gay': {
    background: `${DUCK_HUNT_ASSET_ROOT}/backgrounds/spooky-gay.webp`,
    accent: '#70f5d5',
    glow: '#c866e5',
    spriteFilter: 'saturate(1.35) contrast(1.08) hue-rotate(20deg)',
  },
};

export const DUCK_HUNT_SPRITES = {
  duck: `${DUCK_HUNT_ASSET_ROOT}/sprites/duck-atlas.png`,
  dog: `${DUCK_HUNT_ASSET_ROOT}/sprites/dog-atlas.png`,
  effects: `${DUCK_HUNT_ASSET_ROOT}/sprites/effects-atlas.png`,
} as const;

export const DUCK_FRAMES = {
  flyUp: 0,
  flyLevel: 1,
  flyDown: 2,
  hit: 3,
  fallOne: 4,
  fallTwo: 5,
  fleeUp: 6,
  fleeDown: 7,
} as const;

export const DOG_FRAMES = {
  sniffOne: 0,
  sniffTwo: 1,
  sniffThree: 2,
  jumpOne: 3,
  jumpTwo: 4,
  retrieve: 5,
  laughOne: 6,
  laughTwo: 7,
} as const;

export const EFFECT_FRAMES = {
  feathers: 0,
  muzzle: 1,
  hit: 2,
  dust: 3,
  shell: 4,
  spentShell: 5,
  miss: 6,
  medal: 7,
} as const;

