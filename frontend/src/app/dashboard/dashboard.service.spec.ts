import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';

describe('DashboardService widget layouts', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('adds widgets with their default layout and cycles supported variants', () => {
    const dashboard = TestBed.inject(DashboardService);

    dashboard.add('clock');
    expect(dashboard.widgets()[0].variant).toBe('digital');

    dashboard.cycleVariant('clock');
    expect(dashboard.widgets()[0].variant).toBe('dial');

    dashboard.cycleVariant('clock');
    expect(dashboard.widgets()[0].variant).toBe('digital');
  });

  it('migrates existing saved widgets that predate layout variants', () => {
    localStorage.setItem(
      'dash.layout.v1',
      JSON.stringify([{ type: 'weather', x: 25, y: 40, pinned: true }]),
    );

    const dashboard = TestBed.inject(DashboardService);

    expect(dashboard.widgets()).toEqual([
      {
        type: 'weather',
        x: 25,
        y: 40,
        pinned: true,
        variant: 'stacked',
        scale: 1,
        collapsed: false,
      },
    ]);
  });

  it('reorders portrait widgets without moving pinned slots or losing desktop coordinates', () => {
    const dashboard = TestBed.inject(DashboardService);
    for (const type of ['clock', 'weather', 'notes', 'alarm'] as const) dashboard.add(type);
    dashboard.move('clock', 220, 180);
    dashboard.togglePin('weather');
    dashboard.reorder('clock', 'alarm');
    expect(dashboard.widgets().map((widget) => widget.type)).toEqual(['notes', 'weather', 'alarm', 'clock']);
    expect(dashboard.widgets()[3]).toMatchObject({ x: 220, y: 180 });
    dashboard.reorder('weather', 'notes');
    expect(dashboard.widgets()[1].type).toBe('weather');
    TestBed.tick();
    TestBed.resetTestingModule();
    expect(TestBed.inject(DashboardService).widgets().map((widget) => widget.type)).toEqual(['notes', 'weather', 'alarm', 'clock']);
  });

  it('rejects invalid positions and keeps pinned widgets fixed', () => {
    const dashboard = TestBed.inject(DashboardService);
    dashboard.add('clock');
    dashboard.move('clock', -10, -20);
    expect(dashboard.widgets()[0]).toMatchObject({ x: 0, y: 0 });
    dashboard.move('clock', NaN, Infinity);
    expect(dashboard.widgets()[0]).toMatchObject({ x: 0, y: 0 });
    dashboard.togglePin('clock');
    dashboard.move('clock', 120, 140);
    expect(dashboard.widgets()[0]).toMatchObject({ x: 0, y: 0 });
  });
});
