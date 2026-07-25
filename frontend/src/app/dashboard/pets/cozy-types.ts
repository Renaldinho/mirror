export type CozyItemType = 'bed' | 'house' | 'cushion' | 'tv' | 'bowl';

export interface CozyItem {
  id: string;
  type: CozyItemType;
  x: number;
  y: number;
  enabled?: boolean;
}

export interface CozyItemDefinition {
  type: CozyItemType;
  label: string;
  glyph: string;
  width: number;
  height: number;
  sleepAnchor?: { x: number; y: number };
  watchAnchor?: { x: number; y: number };
  foodAnchor?: { x: number; y: number };
}

export interface CozyBounds {
  width: number;
  height: number;
  topY: number;
  floorY: number;
}

export interface CozyActivityAnchor {
  itemId: string;
  x: number;
  y: number;
  faceX?: number;
  faceY?: number;
}

export interface CozySnapshot {
  items: readonly CozyItem[];
  sleepSpots: readonly CozyActivityAnchor[];
  watchSpots: readonly CozyActivityAnchor[];
  foodSpots: readonly CozyActivityAnchor[];
}
