import { CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { DashboardService } from './dashboard.service';
import { DisplayService } from './display.service';
import { WidgetFrame } from './widget-frame';

describe('widget drag handles', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [WidgetFrame] });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });

  function setup(portrait = false) {
    const dash = TestBed.inject(DashboardService);
    dash.add('clock'); dash.add('notes'); dash.add('alarm');
    const display = TestBed.inject(DisplayService);
    display.viewport.set(portrait ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 });
    const fixture = TestBed.createComponent(WidgetFrame);
    const refresh = () => {
      fixture.componentRef.setInput('widget', dash.widgets().find((widget) => widget.type === 'clock'));
      fixture.detectChanges();
    };
    refresh();
    const drag = fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag);
    return { dash, fixture, drag, refresh, component: fixture.componentInstance };
  }

  it('keeps buttons outside the handle, uses scaled drag bounds, and saves desktop movement', () => {
    const { dash, fixture, drag, refresh, component } = setup();
    dash.setScale('clock', 1);
    refresh();
    const anchor = fixture.nativeElement.querySelector('.anchor') as HTMLElement;
    expect(anchor.style.width).toBe(`${component.layout().width * component.displayScale()}px`);
    expect(anchor.style.height).toBe(`${component.portraitHeight() * component.displayScale()}px`);
    expect(fixture.nativeElement.querySelector('.drag-handle.cdk-drag-handle')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.controls').closest('.cdk-drag-handle')).toBeNull();
    drag.setFreeDragPosition({ x: 340, y: 250 });
    component.onDragEnded({ source: drag } as CdkDragEnd);
    expect(dash.widgets()[0]).toMatchObject({ x: 340, y: 250 });
  });

  it('enables portrait dragging, reorders on drop, and preserves the desktop position', () => {
    const { dash, fixture, drag, component } = setup(true);
    expect(drag.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('button[aria-label="Pin Hours"]')).not.toBeNull();
    const original = { x: dash.widgets()[0].x, y: dash.widgets()[0].y };
    const board = document.createElement('section');
    board.className = 'widget-board';
    const rect = (left: number, right: number) => ({ left, right, top: 0, bottom: 400, width: right - left, height: 400 }) as DOMRect;
    vi.spyOn(board, 'getBoundingClientRect').mockReturnValue(rect(0, 900));
    for (const [index, type] of ['clock', 'notes', 'alarm'].entries()) {
      const frame = document.createElement('app-widget-frame');
      frame.setAttribute('data-widget', type);
      vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue(rect(index * 300, (index + 1) * 300));
      board.appendChild(frame);
      if (type === 'clock') frame.appendChild(fixture.nativeElement);
    }
    document.body.appendChild(board);
    try {
      drag.setFreeDragPosition({ x: 300, y: 0 });
      component.onDragEnded({ source: drag, dropPoint: { x: 450, y: 200 } } as CdkDragEnd);
      expect(dash.widgets().map((widget) => widget.type)).toEqual(['notes', 'clock', 'alarm']);
      expect(dash.widgets()[1]).toMatchObject(original);
      expect(drag.getFreeDragPosition()).toEqual({ x: 0, y: 0 });
    } finally { board.remove(); }
  });

  it('supports keyboard reordering and allows pinned portrait widgets to be unlocked', () => {
    const { dash, fixture, drag, refresh, component } = setup(true);
    component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }));
    expect(dash.widgets().map((widget) => widget.type)).toEqual(['notes', 'clock', 'alarm']);
    dash.togglePin('clock');
    refresh();
    expect(drag.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.drag-handle').disabled).toBe(true);
    fixture.nativeElement.querySelector('button[aria-label="Unpin Hours"]').click();
    refresh();
    expect(drag.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.drag-handle').disabled).toBe(false);
  });
});
