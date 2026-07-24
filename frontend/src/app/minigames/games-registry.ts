/** The minigames available in the arcade. Add one here + a `@switch` branch in
 *  game-overlay.ts + a component to extend. */
export type GameId = 'duck-hunt' | 'whack';

export interface GameMeta {
  id: GameId;
  label: string;
  glyph: string;
  description: string;
}

export const GAMES: GameMeta[] = [
  { id: 'duck-hunt', label: 'Duck Hunt', glyph: '🦆', description: 'Shoot the ducks before they flee.' },
  { id: 'whack', label: 'Whack-a-Mole', glyph: '🔨', description: 'Bonk the moles as they pop.' },
];
