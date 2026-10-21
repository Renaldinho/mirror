import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AlarmService } from './alarm.service';
import { RINGTONES } from './ringtones';
import { UiIcon } from '../shared/ui-icon';

@Component({
  selector: 'app-alarm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIcon],
  template: `
    @if (collapsed()) {
      <div class="mini">
        <strong>{{ alarm.settings().time }}</strong>
        <span [class.on]="alarm.settings().enabled">{{ alarm.nextLabel() }}</span>
      </div>
    } @else {
      <div class="alarm">
        <div class="modes" role="group" aria-label="Alarm mode">
          <button type="button" class="mode" [class.on]="mode() === 'at'" (click)="mode.set('at')">At a time</button>
          <button type="button" class="mode" [class.on]="mode() === 'in'" (click)="mode.set('in')">In a while</button>
        </div>

        @if (mode() === 'at') {
          <div class="clock" [class.armed]="alarm.settings().enabled">
            <div class="unit">
              <button class="step" type="button" aria-label="Hour up" (click)="bumpHour(1)">
                <app-ui-icon class="up" name="chevron-down" />
              </button>
              <span class="digits">{{ hh() }}</span>
              <button class="step" type="button" aria-label="Hour down" (click)="bumpHour(-1)">
                <app-ui-icon name="chevron-down" />
              </button>
            </div>
            <span class="colon">:</span>
            <div class="unit">
              <button class="step" type="button" aria-label="Minute up" (click)="bumpMinute(1)">
                <app-ui-icon class="up" name="chevron-down" />
              </button>
              <span class="digits">{{ mm() }}</span>
              <button class="step" type="button" aria-label="Minute down" (click)="bumpMinute(-1)">
                <app-ui-icon name="chevron-down" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="switch"
            role="switch"
            [class.on]="alarm.settings().enabled"
            [attr.aria-checked]="alarm.settings().enabled"
            (click)="toggle()"
          >
            <span class="sw-label">{{ alarm.settings().enabled ? 'Alarm armed' : 'Alarm off' }}</span>
            <span class="track" aria-hidden="true"><span class="knob"></span></span>
          </button>
        } @else {
          <div class="clock duration" [class.armed]="alarm.settings().enabled">
            <div class="unit">
              <button class="step" type="button" aria-label="Hours up" (click)="bumpDurHour(1)">
                <app-ui-icon class="up" name="chevron-down" />
              </button>
              <span class="digits">{{ durHh() }}</span>
              <button class="step" type="button" aria-label="Hours down" (click)="bumpDurHour(-1)">
                <app-ui-icon name="chevron-down" />
              </button>
              <span class="u-label">hr</span>
            </div>
            <div class="unit">
              <button class="step" type="button" aria-label="Minutes up" (click)="bumpDurMin(1)">
                <app-ui-icon class="up" name="chevron-down" />
              </button>
              <span class="digits">{{ durMm() }}</span>
              <button class="step" type="button" aria-label="Minutes down" (click)="bumpDurMin(-1)">
                <app-ui-icon name="chevron-down" />
              </button>
              <span class="u-label">min</span>
            </div>
          </div>

          <div class="presets">
            @for (p of presets; track p.min) {
              <button type="button" class="chip" [class.on]="isPreset(p.min)" (click)="preset(p.min)">{{ p.label }}</button>
            }
          </div>

          <button
            type="button"
            class="switch"
            role="switch"
            [class.on]="alarm.settings().enabled"
            [attr.aria-checked]="alarm.settings().enabled"
            (click)="toggleIn()"
          >
            <span class="sw-label">{{ alarm.settings().enabled ? 'Cancel timer' : 'Arm in ' + durLabel() }}</span>
            <span class="track" aria-hidden="true"><span class="knob"></span></span>
          </button>
        }

        <div class="ringtone">
          <label class="rt-label" for="alarm-ringtone">Alarm type</label>
          <select id="alarm-ringtone" [value]="alarm.settings().ringtone"
            (change)="alarm.setRingtone($any($event.target).value)">
            @for (r of ringtones; track r.id) {
              <option [value]="r.id">{{ r.label }}</option>
            }
          </select>
        </div>

        <button type="button" class="preview" (click)="alarm.test()">
          <app-ui-icon name="music" /> Preview
        </button>

        <p class="status" [class.active]="alarm.settings().enabled">
          {{ alarm.settings().enabled ? 'Rings ' + alarm.nextLabel() : 'One-time · mirror must stay on' }}
        </p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .alarm { display: flex; flex-direction: column; gap: 12px; justify-content: center; height: 100%; padding: 4px 0; }

    /* At / In segmented toggle. */
    .modes { display: flex; gap: 6px; }
    .mode {
      flex: 1; padding: 8px; border: 1px solid var(--theme-border); border-radius: var(--control-radius);
      background: var(--theme-surface-soft); color: var(--theme-text-muted);
      font: 600 11px/1 var(--theme-font-body); letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: 150ms ease;
    }
    .mode:hover { color: var(--theme-text); background: var(--theme-surface-hover); }
    .mode.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--theme-text); }

    /* Relative presets. */
    .presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .chip {
      padding: 12px 4px; border: 1px solid var(--theme-border); border-radius: var(--control-radius);
      background: var(--theme-surface-soft); color: var(--theme-text);
      font: 600 13px/1 var(--theme-font-body); cursor: pointer; transition: 150ms ease;
    }
    .chip:hover { background: var(--theme-surface-hover); border-color: color-mix(in srgb, var(--accent) 45%, var(--theme-border)); }
    .chip.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--theme-text); }

    /* Custom time stepper — no native time input. */
    .clock { display: flex; align-items: center; justify-content: center; gap: 6px; }
    .clock.duration { gap: 22px; }
    .unit { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .u-label { margin-top: 2px; color: var(--theme-text-muted); font: 600 9px/1 var(--theme-font-body); letter-spacing: 0.18em; text-transform: uppercase; }
    .digits {
      min-width: 1.9ch; text-align: center; font: 700 52px/1 var(--theme-font-display);
      font-variant-numeric: tabular-nums; color: var(--theme-text); letter-spacing: 0.01em;
      transition: color 0.25s ease, text-shadow 0.25s ease;
    }
    .clock.armed .digits { color: var(--accent); text-shadow: 0 0 18px color-mix(in srgb, var(--accent) 45%, transparent); }
    .colon { align-self: center; font: 700 40px/1 var(--theme-font-display); color: var(--theme-text-muted); padding-bottom: 6px; }
    .clock.armed .colon { color: var(--accent); }
    .step {
      display: grid; place-items: center; width: 34px; height: 24px; padding: 0;
      border: 1px solid transparent; border-radius: var(--control-radius);
      background: none; color: var(--theme-text-muted); font-size: 15px; cursor: pointer; transition: 150ms ease;
    }
    .step:hover { color: var(--accent); background: var(--theme-surface-hover); }
    .step .up { display: block; transform: rotate(180deg); }

    /* Custom toggle switch. */
    .switch {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;
      padding: 9px 12px; border: 1px solid var(--theme-border); border-radius: var(--control-radius);
      background: var(--theme-surface-soft); color: var(--theme-text); cursor: pointer; transition: 180ms ease;
    }
    .switch:hover { background: var(--theme-surface-hover); border-color: color-mix(in srgb, var(--accent) 45%, var(--theme-border)); }
    .switch.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
    .sw-label { font: 600 13px/1 var(--theme-font-body); letter-spacing: 0.04em; }
    .track {
      position: relative; flex: none; width: 46px; height: 24px; border-radius: 999px;
      background: var(--theme-control-bg); border: 1px solid var(--theme-border-strong); transition: background 0.2s ease, border-color 0.2s ease;
    }
    .switch.on .track { background: color-mix(in srgb, var(--accent) 40%, transparent); border-color: var(--accent); }
    .knob {
      position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%;
      background: var(--theme-text-muted); transition: transform 0.2s ease, background 0.2s ease;
    }
    .switch.on .knob { transform: translateX(22px); background: var(--accent); }

    /* Alarm type dropdown. */
    .ringtone { display: flex; flex-direction: column; gap: 6px; }
    .rt-label { color: var(--theme-text-muted); font: 600 11px/1 var(--theme-font-body); letter-spacing: 0.14em; text-transform: uppercase; }
    .ringtone select {
      width: 100%; min-height: 44px; padding: 10px 12px;
      border: 1px solid var(--theme-border); border-radius: var(--control-radius);
      background: var(--theme-control-bg); color: var(--theme-text);
      font: 600 13px/1.2 var(--theme-font-body); cursor: pointer;
      transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
    }
    .ringtone select:hover { background: var(--theme-surface-hover); }

    .preview {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
      padding: 10px; border: 1px solid var(--accent); border-radius: var(--control-radius);
      background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--theme-text);
      font: 600 13px/1 var(--theme-font-body); letter-spacing: 0.04em; cursor: pointer; transition: 150ms ease;
    }
    .preview:hover { background: color-mix(in srgb, var(--accent) 24%, transparent); }
    .preview app-ui-icon { color: var(--accent); font-size: 15px; }

    .status { margin: 0; text-align: center; font-size: 12px; color: var(--theme-text-muted); }
    .status.active { color: var(--accent); }

    .mini { display: flex; align-items: center; justify-content: center; gap: 12px; height: 100%; }
    .mini strong { font-size: 22px; color: var(--accent); }
    .mini span { font-size: 11px; color: var(--theme-text-muted); }
    .mini span.on { color: var(--accent); }

    :is(button, select):hover:not(:disabled) {
      border-color: var(--accent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
    }
    :is(button, select):focus-visible {
      outline: 2px solid var(--theme-focus); outline-offset: 3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .digits, .knob, .track, button, select { transition: none; }
    }
  `],
})
export class AlarmWidget {
  readonly alarm = inject(AlarmService);
  readonly collapsed = input(false);
  readonly ringtones = RINGTONES;

  /** 'at' = absolute clock time, 'in' = relative countdown from now. */
  readonly mode = signal<'at' | 'in'>('at');
  readonly duration = signal(10);
  readonly presets = [
    { min: 5, label: '5 min' },
    { min: 10, label: '10 min' },
    { min: 15, label: '15 min' },
    { min: 30, label: '30 min' },
    { min: 60, label: '1 hour' },
    { min: 480, label: '8 hours' },
  ];

  readonly hh = computed(() => this.alarm.settings().time.slice(0, 2));
  readonly mm = computed(() => this.alarm.settings().time.slice(3, 5));

  readonly durHh = computed(() => String(Math.floor(this.duration() / 60)));
  readonly durMm = computed(() => String(this.duration() % 60).padStart(2, '0'));
  readonly durLabel = computed(() => {
    const h = Math.floor(this.duration() / 60);
    const m = this.duration() % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} hr` : `${h}h ${m}m`;
  });

  bumpDurHour(delta: number): void {
    this.setDuration(this.duration() + delta * 60);
  }

  bumpDurMin(delta: number): void {
    this.setDuration(this.duration() + delta * 5);
  }

  /** Fill the duration from a quick preset. */
  preset(minutes: number): void {
    this.setDuration(minutes);
  }

  toggleIn(): void {
    if (this.alarm.settings().enabled) this.alarm.setEnabled(false);
    else this.alarm.ringIn(this.duration());
  }

  isPreset(minutes: number): boolean {
    return this.duration() === minutes;
  }

  /** Clamp to 1 min … 24 h; re-arm live if a timer is already running. */
  private setDuration(value: number): void {
    const clamped = Math.min(1440, Math.max(1, value));
    this.duration.set(clamped);
    if (this.alarm.settings().enabled) this.alarm.ringIn(clamped);
  }

  bumpHour(delta: number): void {
    const [h, m] = this.parts();
    this.alarm.setTime(this.format((h + delta + 24) % 24, m));
  }

  bumpMinute(delta: number): void {
    const [h, m] = this.parts();
    this.alarm.setTime(this.format(h, (m + delta + 60) % 60));
  }

  toggle(): void {
    this.alarm.setEnabled(!this.alarm.settings().enabled);
  }

  private parts(): [number, number] {
    const time = this.alarm.settings().time;
    return [Number(time.slice(0, 2)), Number(time.slice(3, 5))];
  }

  private format(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
