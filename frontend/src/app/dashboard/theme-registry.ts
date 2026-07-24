export const THEME_IDS = [
  'bare',
  'mushroom',
  'occult',
  'star-wars',
  'warhammer',
  'pinkie',
  'emo',
  'spooky-gay',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  glyph: string;
  swatches: readonly [string, string, string];
}

export const THEMES: readonly ThemeDefinition[] = [
  {
    id: 'bare',
    label: 'Bare Mirror',
    description: 'Clear black glass with a soft amber edge light.',
    glyph: '◯',
    swatches: ['#000000', '#20180e', '#e5b96e'],
  },
  {
    id: 'mushroom',
    label: 'Mushroom Forest',
    description: 'Pressed botanicals, moss ink, and warm brass.',
    glyph: '🍄',
    swatches: ['#14170f', '#a2503b', '#a98a4f'],
  },
  {
    id: 'occult',
    label: 'Cursed Occult',
    description: 'Infernal sigils, candle smoke, and blood-red ritual ink.',
    glyph: '⛧',
    swatches: ['#080304', '#8f1024', '#d38a44'],
  },
  {
    id: 'star-wars',
    label: 'Star Wars',
    description: 'Imperial machinery, distant stars, and a red alert glow.',
    glyph: '✦',
    swatches: ['#020308', '#911a20', '#b9cadc'],
  },
  {
    id: 'warhammer',
    label: 'Warhammer',
    description: 'Grimdark cathedrals, purity seals, and battle-worn gold.',
    glyph: '☠',
    swatches: ['#060504', '#751d1c', '#a98548'],
  },
  {
    id: 'pinkie',
    label: 'Pinkie Cutie',
    description: 'Bubblegum gloss, bows, hearts, and tiny sparkles.',
    glyph: '♡',
    swatches: ['#2a101f', '#ff8fca', '#f6d7ff'],
  },
  {
    id: 'emo',
    label: 'Emo Sad',
    description: 'Rainy charcoal, bruised violet, and broken-heart scribbles.',
    glyph: '☂',
    swatches: ['#08080c', '#49364f', '#9c789e'],
  },
  {
    id: 'spooky-gay',
    label: 'Spooky Scary Gay',
    description: 'Camp horror, rainbow ectoplasm, and dancing bones.',
    glyph: '🏳️‍🌈',
    swatches: ['#06030a', '#a543c8', '#37d6b6'],
  },
];

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}
