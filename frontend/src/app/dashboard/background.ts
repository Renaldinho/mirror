import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SettingsService } from './settings.service';
import { DigitalRain } from './digital-rain';

/** Cinematic code rain, independent of the widget theme. Toggles for the rain
 *  and pointer effects live in the control hub. */
@Component({
  selector: 'app-background',
  imports: [DigitalRain],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop pointer-events-none absolute inset-0" aria-hidden="true">
      @if (settings.matrixRain()) { <app-digital-rain id="matrix-background" /> }
    </div>
  `,
  styles: [`
    .backdrop { overflow: hidden; background: #000; }
  `],
})
export class Background {
  readonly settings = inject(SettingsService);
}
