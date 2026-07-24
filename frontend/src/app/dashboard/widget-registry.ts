import { ArtKey } from './specimen-art';

/** The widget kinds available on the board. Add a new kind here + a component
 *  branch in widget-frame.ts to extend the dashboard. */
export type WidgetType = 'weather' | 'clock' | 'quote' | 'notes' | 'spotify';

export interface WidgetMeta {
  type: WidgetType;
  /** Common name shown on the herbarium label. */
  label: string;
  /** Latin binomial (flavour) under the label. */
  latin: string;
  /** Small glyph in the picker. */
  icon: string;
  /** Botanical illustration for this plate. */
  art: ArtKey;
  /** Per-widget accent color so plates are distinguishable. */
  accent: string;
  /** Default frame size in px when first placed. */
  width: number;
  height: number;
}

export const WIDGETS: WidgetMeta[] = [
  { type: 'clock', label: 'Hours', latin: 'Hora nocturna', icon: '⏳', art: 'moth', accent: 'var(--widget-clock-accent)', width: 260, height: 210 },
  { type: 'weather', label: 'Weather', latin: 'Nimbus vagus', icon: '☁', art: 'fern', accent: 'var(--widget-weather-accent)', width: 300, height: 250 },
  { type: 'quote', label: 'Aphorism', latin: 'Flora poetica', icon: '❝', art: 'bloom', accent: 'var(--widget-quote-accent)', width: 340, height: 240 },
  { type: 'notes', label: 'Marginalia', latin: 'Hedera scripta', icon: '✒', art: 'ivy', accent: 'var(--widget-notes-accent)', width: 300, height: 280 },
  { type: 'spotify', label: 'Now Playing', latin: 'Fungus sonorus', icon: '♪', art: 'mushroom', accent: 'var(--widget-spotify-accent)', width: 320, height: 320 },
];

export const WIDGET_META: Record<WidgetType, WidgetMeta> = Object.fromEntries(
  WIDGETS.map((w) => [w.type, w]),
) as Record<WidgetType, WidgetMeta>;
