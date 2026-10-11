/** Alarm ringtones: each pairs a looping sound with the face/vibe shown in the
 *  ringing popup. Assets live in `public/alarms/`. */
export interface Ringtone {
  id: string;
  label: string;
  /** Looping alarm audio. */
  sound: string;
  /** Portrait shown in the popup (and as the picker thumbnail). */
  image: string;
  alt: string;
  /** Big meme caption under the time in the popup. */
  caption: string;
  /** Flavour line beneath the caption. */
  subtitle: string;
}

export const RINGTONES: readonly Ringtone[] = [
  {
    id: 'petah-gryffin',
    label: 'Petah Gryffin',
    sound: '/alarms/peter-laugh-T1G4wNahcFA.m4a',
    image: '/alarms/peter-low-quality.jpg',
    alt: 'Low-quality Peter Griffin',
    caption: 'HEHEHEHEHE',
    subtitle: 'Petah Gryffin says rise and grind 🐔',
  },
  {
    id: 'star-destroyer',
    label: 'Imperial Star Destroyer',
    sound: '/alarms/star-destroyer-7ejH_BihwFQ.m4a',
    image: '/alarms/star-destroyer.png',
    alt: 'Imperial Star Destroyer',
    caption: 'ALL WINGS REPORT IN',
    subtitle: 'The Empire does not tolerate oversleeping ⭐',
  },
  {
    id: 'faaaah',
    label: 'Faaaah',
    sound: '/alarms/faaaah-0ohfbAPupk0.m4a',
    image: '/alarms/faaaah-squirrel-tenor.png',
    alt: 'Screaming squirrel disintegrating into dust',
    caption: '',
    subtitle: '',
  },
  {
    id: 'good-morning-pineapple',
    label: 'Good Morning Pineapple',
    sound: '/alarms/good-morning-pineapple-DHXlkTpT0Vg.m4a',
    image: '/alarms/good-morning-pineapple.jpg',
    alt: 'Good Morning Pineapple meme',
    caption: '',
    subtitle: '',
  },
];

export const DEFAULT_RINGTONE = RINGTONES[0].id;

export function getRingtone(id: string): Ringtone {
  return RINGTONES.find((ringtone) => ringtone.id === id) ?? RINGTONES[0];
}
