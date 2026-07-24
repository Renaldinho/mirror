import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Background } from './dashboard/background';
import { LightingControl } from './dashboard/lighting-control';
import { WidgetGrid } from './dashboard/widget-grid';
import { WidgetFrame } from './dashboard/widget-frame';
import { PetRenderer } from './dashboard/pet-renderer';
import { DashboardService } from './dashboard/dashboard.service';
import { ThemePicker } from './dashboard/theme-picker';

@Component({
  selector: 'app-root',
  imports: [Background, LightingControl, WidgetGrid, WidgetFrame, PetRenderer, ThemePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly dash = inject(DashboardService);
}
