import { Injectable, effect, signal } from '@angular/core';
import {
  WidgetType,
  WidgetVariantId,
  WIDGET_META,
} from './widget-registry';

/** A widget placed on the board. Single instance per type, so `type` is the id. */
export interface WidgetInstance {
  type: WidgetType;
  x: number;
  y: number;
  pinned: boolean;
  variant: WidgetVariantId;
}

const STORAGE_KEY = 'dash.layout.v1';

/** Persisted placement, pin state, and visual layout for dashboard widgets. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly widgets = signal<WidgetInstance[]>(this.load());

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.widgets())));
  }

  isActive(type: WidgetType): boolean {
    return this.widgets().some((widget) => widget.type === type);
  }

  toggle(type: WidgetType): void {
    this.isActive(type) ? this.remove(type) : this.add(type);
  }

  add(type: WidgetType): void {
    if (this.isActive(type)) return;
    const position = this.nextSlot();
    const variant = WIDGET_META[type].layouts[0].id;
    this.widgets.update((list) => [
      ...list,
      { type, x: position.x, y: position.y, pinned: false, variant },
    ]);
  }

  remove(type: WidgetType): void {
    this.widgets.update((list) => list.filter((widget) => widget.type !== type));
  }

  togglePin(type: WidgetType): void {
    this.widgets.update((list) =>
      list.map((widget) =>
        widget.type === type ? { ...widget, pinned: !widget.pinned } : widget,
      ),
    );
  }

  cycleVariant(type: WidgetType): void {
    const layouts = WIDGET_META[type].layouts;
    if (layouts.length < 2) return;

    this.widgets.update((list) =>
      list.map((widget) => {
        if (widget.type !== type) return widget;
        const currentIndex = layouts.findIndex((layout) => layout.id === widget.variant);
        const nextIndex = (Math.max(currentIndex, 0) + 1) % layouts.length;
        return { ...widget, variant: layouts[nextIndex].id };
      }),
    );
  }

  move(type: WidgetType, x: number, y: number): void {
    this.widgets.update((list) =>
      list.map((widget) => (widget.type === type ? { ...widget, x, y } : widget)),
    );
  }

  private nextSlot(): { x: number; y: number } {
    const count = this.widgets().length;
    return { x: 140 + (count % 4) * 60, y: 120 + (count % 4) * 60 };
  }

  private load(): WidgetInstance[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Partial<WidgetInstance>[];
      return parsed
        .filter(
          (widget): widget is Partial<WidgetInstance> & { type: WidgetType } =>
            !!widget?.type && widget.type in WIDGET_META,
        )
        .map((widget) => {
          const meta = WIDGET_META[widget.type];
          const variant = meta.layouts.some((layout) => layout.id === widget.variant)
            ? widget.variant!
            : meta.layouts[0].id;
          return {
            type: widget.type,
            x: Number.isFinite(widget.x) ? widget.x! : 140,
            y: Number.isFinite(widget.y) ? widget.y! : 120,
            pinned: widget.pinned === true,
            variant,
          };
        });
    } catch {
      return [];
    }
  }
}
