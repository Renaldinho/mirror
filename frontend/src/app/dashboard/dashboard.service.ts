import { Injectable, effect, signal } from '@angular/core';
import { WidgetType, WIDGET_META } from './widget-registry';

/** A widget placed on the board. Single instance per type, so `type` is the id. */
export interface WidgetInstance {
  type: WidgetType;
  x: number;
  y: number;
  pinned: boolean;
}

const STORAGE_KEY = 'dash.layout.v1';

/**
 * Single source of truth for the board: which widgets are placed, where, and
 * whether they're pinned. Persisted to localStorage so the arrangement survives
 * reloads. (Each widget persists its own *content* under its own key.)
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly widgets = signal<WidgetInstance[]>(this.load());

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.widgets())));
  }

  isActive(type: WidgetType): boolean {
    return this.widgets().some((w) => w.type === type);
  }

  /** Sidebar click toggles a widget on/off the board. */
  toggle(type: WidgetType): void {
    this.isActive(type) ? this.remove(type) : this.add(type);
  }

  add(type: WidgetType): void {
    if (this.isActive(type)) return;
    const pos = this.nextSlot();
    this.widgets.update((list) => [...list, { type, x: pos.x, y: pos.y, pinned: false }]);
  }

  remove(type: WidgetType): void {
    this.widgets.update((list) => list.filter((w) => w.type !== type));
  }

  togglePin(type: WidgetType): void {
    this.widgets.update((list) =>
      list.map((w) => (w.type === type ? { ...w, pinned: !w.pinned } : w)),
    );
  }

  move(type: WidgetType, x: number, y: number): void {
    this.widgets.update((list) =>
      list.map((w) => (w.type === type ? { ...w, x, y } : w)),
    );
  }

  /** Stagger new widgets diagonally so they don't stack exactly. */
  private nextSlot(): { x: number; y: number } {
    const n = this.widgets().length;
    return { x: 140 + (n % 4) * 60, y: 120 + (n % 4) * 60 };
  }

  private load(): WidgetInstance[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as WidgetInstance[];
      // Drop any persisted types no longer in the registry.
      return parsed.filter((w) => w && (w.type in WIDGET_META));
    } catch {
      return [];
    }
  }
}
