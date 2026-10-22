import { IconName } from '../shared/ui-icon';

/** The minigames available in the arcade. Add one here + a `@switch` branch in
 *  game-overlay.ts + a component to extend. */
export type GameId = 'duck-hunt' | 'whack' | 'pong';

export interface GameMeta {
  id: GameId;
  label: string;
  icon: IconName;
  thumbnail?: string;
  description: string;
}

export const GAMES: GameMeta[] = [
  {
    id: 'duck-hunt',
    label: 'Duck Hunt',
    icon: 'duck',
    thumbnail: '/games/duck-hunt/thumbnail.webp',
    description: 'Shoot the ducks before they flee.',
  },
  { id: 'whack', label: 'Whack-a-Mole', icon: 'hammer', thumbnail: '/games/whack/thumbnail.png', description: 'Bonk the moles as they pop.' },
  { id: 'pong', label: 'Pong', icon: 'pong', thumbnail: '/games/pong/thumbnail.svg', description: 'Challenge your companion. First to seven wins; high score tracks your longest rally.' },
];
