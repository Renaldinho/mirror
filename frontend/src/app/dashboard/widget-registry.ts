/** The widget kinds available on the board. Add a new kind here + a component
 *  branch in widget-frame.ts to extend the dashboard. */
export type WidgetType = 'weather' | 'clock' | 'quote' | 'notes' | 'spotify';

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  /** Small glyph in the sidebar/title. */
  icon: string;
  /** Large faint botanical watermark drawn in the card — gives each widget its own identity. */
  motif: string;
  /** Per-widget accent color (borders, ornaments, title) so widgets are distinguishable. */
  accent: string;
  /** Default frame size in px when first placed. */
  width: number;
  height: number;
}

export const WIDGETS: WidgetMeta[] = [
  { type: 'clock', label: 'Hours', icon: '⏳', motif: '⚘', accent: '#b8975a', width: 260, height: 180 },
  { type: 'weather', label: 'Weather', icon: '☁', motif: '❀', accent: '#7d97a3', width: 300, height: 230 },
  { type: 'quote', label: 'Aphorism', icon: '❝', motif: '❦', accent: '#b05a44', width: 330, height: 210 },
  { type: 'notes', label: 'Marginalia', icon: '✒', motif: '❧', accent: '#8a9a5b', width: 300, height: 260 },
  { type: 'spotify', label: 'Now Playing', icon: '♪', motif: '✿', accent: '#9578a6', width: 320, height: 300 },
];

export const WIDGET_META: Record<WidgetType, WidgetMeta> = Object.fromEntries(
  WIDGETS.map((w) => [w.type, w]),
) as Record<WidgetType, WidgetMeta>;
