import { Injectable, computed, effect, signal } from '@angular/core';
import {
  CozyActivityAnchor,
  CozyBounds,
  CozyItem,
  CozyItemDefinition,
  CozyItemType,
  CozySnapshot,
} from './cozy-types';

export const COZY_STORAGE_KEY = 'dash.pet-cozy.v1';
export const LEGACY_HABITAT_STORAGE_KEY = 'dash.pet-habitat.v1';

export const COZY_CATALOG: Readonly<Record<CozyItemType, CozyItemDefinition>> = {
  bed: {
    type: 'bed',
    label: 'Bed',
    glyph: 'Zz',
    width: 184,
    height: 152,
    // The pet position is its sprite's top edge; place it over the open cushion.
    sleepAnchor: { x: 92, y: 46 },
  },
  house: {
    type: 'house',
    label: 'Pet house',
    glyph: '^',
    width: 184,
    height: 193,
    sleepAnchor: { x: 92, y: 150 },
  },
  cushion: {
    type: 'cushion',
    label: 'Cushion',
    glyph: 'o',
    width: 160,
    height: 100,
    sleepAnchor: { x: 80, y: 28 },
  },
  tv: {
    type: 'tv',
    label: 'Tiny TV',
    glyph: 'TV',
    width: 126,
    height: 127,
    watchAnchor: { x: 63, y: 154 },
  },
  bowl: {
    type: 'bowl', label: 'Food bowl', glyph: '♡', width: 120, height: 74,
    foodAnchor: { x: 60, y: 64 },
  },
};

export const COZY_ITEMS = Object.values(COZY_CATALOG);

interface StoredCozySpace {
  version: 1;
  bounds: CozyBounds;
  items: CozyItem[];
}

@Injectable({ providedIn: 'root' })
export class PetCozyService {
  readonly items = signal<CozyItem[]>([]);
  readonly editing = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly selected = computed(
    () => this.items().find((item) => item.id === this.selectedId()) ?? null,
  );

  private loaded = false;
  private lastBounds: CozyBounds | null = null;
  private cachedItems: CozyItem[] | null = null;
  private cachedSnapshot: CozySnapshot | null = null;

  constructor() {
    effect(() => {
      const items = this.items();
      if (!this.loaded || !this.lastBounds) return;
      const stored: StoredCozySpace = {
        version: 1,
        bounds: this.lastBounds,
        items,
      };
      localStorage.setItem(COZY_STORAGE_KEY, JSON.stringify(stored));
    });
  }

  initialise(bounds: CozyBounds): void {
    this.lastBounds = bounds;
    if (this.loaded) return;
    this.loaded = true;
    const stored = this.readStored();
    this.items.set(this.reconcile(stored?.items ?? [], bounds));
    localStorage.removeItem(LEGACY_HABITAT_STORAGE_KEY);
  }

  resize(bounds: CozyBounds): void {
    this.initialise(bounds);
    if (
      this.lastBounds?.width === bounds.width &&
      this.lastBounds?.height === bounds.height &&
      this.lastBounds?.topY === bounds.topY &&
      this.lastBounds?.floorY === bounds.floorY
    ) return;
    this.lastBounds = bounds;
    this.items.set(this.reconcile(this.items(), bounds));
  }

  snapshot(bounds: CozyBounds): CozySnapshot {
    this.resize(bounds);
    const items = this.items();
    if (this.cachedSnapshot && this.cachedItems === items) return this.cachedSnapshot;
    const sleepSpots: CozyActivityAnchor[] = [];
    const watchSpots: CozyActivityAnchor[] = [];
    const foodSpots: CozyActivityAnchor[] = [];
    for (const item of items) {
      const definition = COZY_CATALOG[item.type];
      if (definition.sleepAnchor) {
        sleepSpots.push({
          itemId: item.id,
          x: item.x + definition.sleepAnchor.x,
          y: item.y + definition.sleepAnchor.y,
        });
      }
      if (definition.watchAnchor && item.enabled) {
        watchSpots.push({
          itemId: item.id,
          x: clamp(item.x + definition.watchAnchor.x, 0, bounds.width),
          y: clamp(item.y + definition.watchAnchor.y, bounds.topY, bounds.floorY),
          faceX: item.x + definition.width / 2,
          faceY: item.y + definition.height / 2,
        });
      }
      if (definition.foodAnchor) foodSpots.push({ itemId: item.id, x: item.x + definition.foodAnchor.x, y: item.y + definition.foodAnchor.y });
    }
    this.cachedItems = items;
    this.cachedSnapshot = { items, sleepSpots, watchSpots, foodSpots };
    return this.cachedSnapshot;
  }

  preview(type: CozyItemType, x: number, y: number, bounds: CozyBounds, id = 'preview'): CozyItem {
    return this.clampItem({ id, type, x, y, enabled: type === 'tv' ? true : undefined }, bounds);
  }

  add(item: CozyItem, bounds: CozyBounds): boolean {
    if (this.items().some((candidate) => candidate.type === item.type)) return false;
    const placed = this.clampItem({ ...item, id: `cozy-${item.type}` }, bounds);
    this.lastBounds = bounds;
    this.items.update((items) => [...items, placed]);
    this.selectedId.set(placed.id);
    return true;
  }

  move(id: string, x: number, y: number, bounds: CozyBounds): boolean {
    const current = this.items().find((item) => item.id === id);
    if (!current) return false;
    const moved = this.clampItem({ ...current, x, y }, bounds);
    this.lastBounds = bounds;
    this.items.update((items) => items.map((item) => item.id === id ? moved : item));
    return true;
  }

  removeSelected(bounds: CozyBounds): boolean {
    const id = this.selectedId();
    if (!id) return false;
    this.lastBounds = bounds;
    this.items.update((items) => items.filter((item) => item.id !== id));
    this.selectedId.set(null);
    return true;
  }

  clear(bounds: CozyBounds): void {
    this.lastBounds = bounds;
    this.items.set([]);
    this.selectedId.set(null);
  }

  toggleTv(): void {
    this.items.update((items) => items.map((item) =>
      item.type === 'tv' ? { ...item, enabled: !item.enabled } : item
    ));
  }

  has(type: CozyItemType): boolean {
    return this.items().some((item) => item.type === type);
  }

  sleepSpotAt(x: number, y: number, bounds: CozyBounds): CozyActivityAnchor | null {
    const item = [...this.items()].reverse().find((candidate) => {
      if (!COZY_CATALOG[candidate.type].sleepAnchor) return false;
      const definition = COZY_CATALOG[candidate.type];
      return x >= candidate.x && x <= candidate.x + definition.width &&
        y >= candidate.y && y <= candidate.y + definition.height;
    });
    if (!item) return null;
    return this.snapshot(bounds).sleepSpots.find((spot) => spot.itemId === item.id) ?? null;
  }

  private reconcile(items: readonly CozyItem[], bounds: CozyBounds): CozyItem[] {
    const seen = new Set<CozyItemType>();
    return items
      .filter((item) => {
        if (!item || !(item.type in COZY_CATALOG) || seen.has(item.type)) return false;
        seen.add(item.type);
        return Number.isFinite(item.x) && Number.isFinite(item.y);
      })
      .map((item) => this.clampItem(item, bounds));
  }

  private clampItem(item: CozyItem, bounds: CozyBounds): CozyItem {
    const definition = COZY_CATALOG[item.type];
    return {
      ...item,
      x: clamp(item.x, 0, Math.max(0, bounds.width - definition.width)),
      y: clamp(
        item.y,
        bounds.topY,
        Math.max(bounds.topY, bounds.floorY - definition.height),
      ),
      enabled: item.type === 'tv' ? item.enabled !== false : undefined,
    };
  }

  private readStored(): StoredCozySpace | null {
    try {
      const parsed = JSON.parse(localStorage.getItem(COZY_STORAGE_KEY) ?? 'null') as StoredCozySpace | null;
      return parsed?.version === 1 && Array.isArray(parsed.items) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
