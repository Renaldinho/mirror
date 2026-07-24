import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/** One corner-sized SVG ornament selected by the active theme. */
@Component({
  selector: 'app-corner-flourish',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (settings.theme()) {
      @case ('mushroom') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M4 44C4 20 20 4 44 4M13 33C11 23 17 15 27 12" stroke="currentColor" opacity=".72"/>
          <path d="M17 22Q8 21 4 12Q13 13 17 22ZM31 12Q32 3 41-1Q40 8 31 12Z" fill="currentColor" opacity=".48"/>
          <g fill="currentColor" opacity=".86"><circle cx="46" cy="7" r="1.6"/><circle cx="46" cy="3.4" r="1.8"/><circle cx="49.4" cy="6" r="1.8"/><circle cx="43" cy="9" r="1.8"/></g>
        </svg>
      }
      @case ('occult') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M3 55V24L24 3H55M10 58V29L29 10H58" stroke="currentColor" opacity=".55"/>
          <circle cx="35" cy="31" r="17" stroke="currentColor" opacity=".62"/>
          <path d="M35 14L45 44L19 25H51L25 44Z" stroke="currentColor" opacity=".7"/>
          <path d="M53 5Q62 15 53 24Q44 15 53 5Z" fill="currentColor" opacity=".5"/>
        </svg>
      }
      @case ('star-wars') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M3 54V20L20 3H55M10 60V27L27 10H60" stroke="currentColor" opacity=".5"/>
          <path d="M15 18H41M8 27H28M27 8V28" stroke="currentColor" opacity=".68"/>
          <path d="M39 32L49 38V50L39 56V32ZM69 32L59 38V50L69 56V32ZM49 41H59M49 47H59" stroke="currentColor" opacity=".72"/>
        </svg>
      }
      @case ('warhammer') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M3 58V31Q3 11 27 3Q51 11 51 31V58M11 58V32Q11 18 27 11Q43 18 43 32V58" stroke="currentColor" opacity=".55"/>
          <circle cx="27" cy="32" r="10" stroke="currentColor" opacity=".7"/>
          <path d="M20 35V44L24 40L27 46L30 40L34 44V35M22 29h2M30 29h2M42 48L61 38M42 54L64 49" stroke="currentColor" opacity=".62"/>
        </svg>
      }
      @case ('pinkie') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M4 50C6 22 22 6 50 4M12 55C14 31 31 14 55 12" stroke="currentColor" opacity=".45"/>
          <path d="M25 20C14 8 3 24 25 38C47 24 36 8 25 20Z" fill="currentColor" opacity=".62"/>
          <path d="M48 31L51 39L59 42L51 45L48 53L45 45L37 42L45 39Z" fill="currentColor" opacity=".78"/>
          <path d="M6 8Q17 8 20 18Q10 15 6 8ZM20 18Q24 6 34 7Q28 15 20 18Z" stroke="currentColor" opacity=".6"/>
        </svg>
      }
      @case ('emo') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M4 56L17 5M21 64L35 8M40 60L53 10" stroke="currentColor" opacity=".42"/>
          <path d="M45 29C31 13 17 35 45 53C73 35 59 13 45 29ZM45 29L36 39L49 43L40 51" stroke="currentColor" opacity=".72"/>
          <path d="M7 23Q14 32 7 39Q0 32 7 23Z" fill="currentColor" opacity=".58"/>
        </svg>
      }
      @case ('spooky-gay') {
        <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <path d="M3 56C11 24 28 7 59 3M11 61C19 33 34 18 62 11" stroke="currentColor" opacity=".46"/>
          <path d="M15 12Q24 2 33 12L28 9L24 17L20 9Z" fill="currentColor" opacity=".7"/>
          <path d="M39 57V39A12 12 0 0 1 63 39V57L57 51L51 57L45 51Z" stroke="currentColor" opacity=".68"/>
          <circle cx="47" cy="39" r="1.6" fill="currentColor"/><circle cx="56" cy="39" r="1.6" fill="currentColor"/>
        </svg>
      }
    }
  `,
  styles: [
    `
      :host { display: block; }
      svg { display: block; width: 100%; height: 100%; overflow: visible; }
      :host-context([data-theme='occult']) svg { animation: pulse 7s ease-in-out infinite alternate; }
      :host-context([data-theme='pinkie']) svg,
      :host-context([data-theme='spooky-gay']) svg { animation: glimmer 5s ease-in-out infinite alternate; }
      :host-context([data-theme='emo']) svg { animation: drift 6s linear infinite; }
      @keyframes pulse { from { opacity: .65; } to { opacity: 1; } }
      @keyframes glimmer { from { filter: drop-shadow(0 0 0 transparent); } to { filter: drop-shadow(0 0 4px currentColor); } }
      @keyframes drift { from { transform: translateY(-1px); } to { transform: translateY(2px); } }
    `,
  ],
})
export class CornerFlourish {
  readonly settings = inject(SettingsService);
}
