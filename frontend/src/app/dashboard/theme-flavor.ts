import { ThemeId } from './theme-registry';

/** In-character copy for widget empty states and placeholders, per theme. */
export interface ThemeFlavor {
  notesPlaceholder: string;
  addItem: string;
  connect: string;
  nothingPlaying: string;
  noLyrics: string;
}

const DEFAULT_FLAVOR: ThemeFlavor = {
  notesPlaceholder: 'Jot a thought…',
  addItem: 'Add an item…',
  connect: 'Connect Spotify',
  nothingPlaying: 'Nothing playing',
  noLyrics: 'No lyrics found for this track.',
};

/** Overrides merge onto DEFAULT_FLAVOR, so a theme only states what it changes. */
const OVERRIDES: Partial<Record<ThemeId, Partial<ThemeFlavor>>> = {
  mushroom: {
    notesPlaceholder: 'Press a thought between the pages…',
    addItem: 'Add a sprig…',
    nothingPlaying: 'The grove is quiet',
    noLyrics: 'No song pressed for this track.',
  },
  occult: {
    notesPlaceholder: 'Scribe your incantations…',
    addItem: 'Inscribe a rite…',
    connect: 'Summon Spotify',
    nothingPlaying: 'The silence watches',
    noLyrics: 'No verses divined for this track.',
  },
  'star-wars': {
    notesPlaceholder: 'Log entry…',
    addItem: 'New directive…',
    connect: 'Link Spotify',
    nothingPlaying: 'No transmission',
    noLyrics: 'No records for this track.',
  },
  warhammer: {
    notesPlaceholder: 'Record thy oaths…',
    addItem: 'Swear a duty…',
    connect: 'Bind Spotify',
    nothingPlaying: 'The vox is silent',
    noLyrics: 'No litany found for this track.',
  },
  pinkie: {
    notesPlaceholder: 'write something cute! ♡',
    addItem: 'add a to-do! ✿',
    connect: 'Connect Spotify ♫',
    nothingPlaying: 'nothing playing~',
    noLyrics: 'aw, no lyrics for this one :(',
  },
  emo: {
    notesPlaceholder: 'write it down, no one has to read it…',
    addItem: 'another thing to carry…',
    nothingPlaying: 'silence, again',
    noLyrics: 'no words for this one.',
  },
  'spooky-gay': {
    notesPlaceholder: 'manifest your thoughts ✧',
    addItem: 'conjure a task ✧',
    connect: 'Connect Spotify',
    nothingPlaying: 'the void is quiet',
    noLyrics: 'no lyrics haunting this track.',
  },
};

export function themeFlavor(theme: ThemeId): ThemeFlavor {
  return { ...DEFAULT_FLAVOR, ...OVERRIDES[theme] };
}
