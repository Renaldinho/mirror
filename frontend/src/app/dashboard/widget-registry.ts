import { ArtKey } from './specimen-art';

/** The widget kinds available on the board. */
export type WidgetType = 'weather' | 'clock' | 'quote' | 'notes' | 'spotify' | 'lyrics';

export type WidgetVariantId =
  | 'default'
  | 'digital'
  | 'dial'
  | 'stacked'
  | 'compact';

export interface WidgetLayout {
  id: WidgetVariantId;
  label: string;
  width: number;
  height: number;
}

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  latin: string;
  icon: string;
  art: ArtKey;
  accent: string;
  layouts: readonly WidgetLayout[];
}

export const WIDGETS: WidgetMeta[] = [
  {
    type: 'clock',
    label: 'Hours',
    latin: 'Hora nocturna',
    icon: '⏳',
    art: 'moth',
    accent: 'var(--widget-clock-accent)',
    layouts: [
      { id: 'digital', label: 'Digital', width: 260, height: 210 },
      { id: 'dial', label: 'Circular dial', width: 270, height: 270 },
    ],
  },
  {
    type: 'weather',
    label: 'Weather',
    latin: 'Nimbus vagus',
    icon: '☁',
    art: 'fern',
    accent: 'var(--widget-weather-accent)',
    layouts: [
      { id: 'stacked', label: 'Stacked', width: 300, height: 250 },
      { id: 'compact', label: 'Wide compact', width: 360, height: 210 },
    ],
  },
  {
    type: 'quote',
    label: 'Aphorism',
    latin: 'Flora poetica',
    icon: '❝',
    art: 'bloom',
    accent: 'var(--widget-quote-accent)',
    layouts: [{ id: 'default', label: 'Default', width: 340, height: 240 }],
  },
  {
    type: 'notes',
    label: 'Marginalia',
    latin: 'Hedera scripta',
    icon: '✒',
    art: 'ivy',
    accent: 'var(--widget-notes-accent)',
    layouts: [{ id: 'default', label: 'Default', width: 300, height: 280 }],
  },
  {
    type: 'spotify',
    label: 'Now Playing',
    latin: 'Fungus sonorus',
    icon: '♪',
    art: 'mushroom',
    accent: 'var(--widget-spotify-accent)',
    layouts: [{ id: 'default', label: 'Default', width: 320, height: 320 }],
  },
  {
    type: 'lyrics',
    label: 'Lyrics',
    latin: 'Carmen synchronum',
    icon: '♫',
    art: 'bloom',
    accent: 'var(--widget-spotify-accent)',
    layouts: [{ id: 'default', label: 'Default', width: 300, height: 360 }],
  },
];

export const WIDGET_META: Record<WidgetType, WidgetMeta> = Object.fromEntries(
  WIDGETS.map((widget) => [widget.type, widget]),
) as Record<WidgetType, WidgetMeta>;
