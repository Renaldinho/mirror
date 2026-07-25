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
});
