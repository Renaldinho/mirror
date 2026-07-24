import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SettingsService } from './settings.service';

/**
 * Theme-aware smart-mirror illumination. Practical light stays warm and close
 * to the glass edge; theme artwork is a separate, dim decorative layer.
 */
@Component({
  selector: 'app-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="backdrop pointer-events-none absolute inset-0 transition-opacity duration-500"
      [attr.data-motif]="settings.theme()"
      [style.opacity]="onFactor()"
    >
      <div class="warm-light absolute inset-0" [style.opacity]="light()"></div>
      <div class="glow absolute inset-0" [style.opacity]="0.16 + light() * 0.34"></div>
      <div class="ambient absolute inset-0"></div>

      @switch (settings.theme()) {
        @case ('mushroom') {
          <svg class="motif motif-floor" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <g fill="var(--color-fern)" opacity=".4">
              <path d="M0 200C15 158 12 125 35 86C24 130 48 164 66 200Z"/>
              <path d="M400 200C382 155 390 120 366 91C378 132 351 165 337 200Z"/>
            </g>
            <g opacity=".65">
              <g transform="translate(78 169)"><rect x="-4" width="8" height="31" rx="3" fill="var(--color-spore)"/><path d="M-20 3Q0-24 20 3Z" fill="var(--color-cap)"/></g>
              <g transform="translate(329 176) scale(.7)"><rect x="-4" width="8" height="34" rx="3" fill="var(--color-spore)"/><path d="M-22 3Q0-26 22 3Z" fill="var(--color-cap)"/></g>
              <g transform="translate(25 187) scale(.45)"><rect x="-4" width="8" height="28" rx="3" fill="var(--color-spore)"/><path d="M-20 3Q0-22 20 3Z" fill="var(--color-moss)"/></g>
            </g>
          </svg>
        }
        @case ('occult') {
          <svg class="motif motif-full occult-map" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g class="ritual-wheel" transform="translate(200 112)" fill="none" stroke="var(--theme-secondary)" opacity=".3">
              <circle r="72"/><circle r="58"/><path d="M0-58L34 47L-55-18H55L-34 47Z"/>
              <circle cy="-72" r="3"/><circle cx="68" cy="22" r="3"/><circle cx="-68" cy="22" r="3"/>
            </g>
            <g fill="none" stroke="var(--theme-primary)" opacity=".23">
              <path d="M5 66Q29 28 65 5M395 66Q371 28 335 5M5 166Q28 196 65 215M395 166Q372 196 335 215"/>
              <path d="M17 29L34 49L13 54M383 29L366 49L387 54"/>
            </g>
          </svg>
        }
        @case ('star-wars') {
          <svg class="motif motif-full star-field" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="var(--theme-text)" opacity=".58">
              <circle cx="35" cy="31" r=".8"/><circle cx="81" cy="72" r=".55"/><circle cx="122" cy="20" r=".7"/><circle cx="176" cy="58" r=".5"/>
              <circle cx="218" cy="27" r=".75"/><circle cx="272" cy="66" r=".55"/><circle cx="332" cy="30" r=".85"/><circle cx="370" cy="93" r=".5"/>
              <circle cx="57" cy="142" r=".6"/><circle cx="151" cy="126" r=".45"/><circle cx="244" cy="145" r=".6"/>
            </g>
            <g transform="translate(330 174)" opacity=".24">
              <circle r="68" fill="none" stroke="var(--theme-text)"/><path d="M-65-8H65M-39-49L46 48M-61 20L57-23" stroke="var(--theme-text)"/>
              <circle cx="-18" cy="-24" r="9" fill="none" stroke="var(--theme-secondary)" stroke-width="2"/>
            </g>
            <g fill="none" stroke="var(--theme-secondary)" opacity=".45" transform="translate(67 110)">
              <path d="M-20-18L-8-11V11L-20 18ZM20-18L8-11V11L20 18ZM-8-7H8M-8 7H8"/>
            </g>
          </svg>
        }
        @case ('warhammer') {
          <svg class="motif motif-full grimdark" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="var(--theme-primary)" opacity=".22">
              <path d="M0 220V92Q28 36 64 13Q101 36 128 92V220M272 220V92Q300 36 336 13Q373 36 400 92V220"/>
              <path d="M20 220V101Q39 59 64 43Q89 59 108 101V220M292 220V101Q311 59 336 43Q361 59 380 101V220"/>
              <path d="M64 43V220M336 43V220"/>
            </g>
            <g transform="translate(200 174)" stroke="var(--theme-secondary)" fill="none" opacity=".32">
              <circle cy="-10" r="19"/><path d="M-13 4V19L-6 13L0 21L6 13L13 19V4M-7-12h2M5-12h2"/>
              <path d="M-65 18L-22-7M65 18L22-7M-66 12L-35 2M66 12L35 2"/>
            </g>
          </svg>
        }
        @case ('pinkie') {
          <svg class="motif motif-full cutie-sparkles" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="var(--theme-primary)" opacity=".42">
              <path d="M37 45C20 27 3 53 37 74C71 53 54 27 37 45Z"/><path d="M357 159C344 145 330 165 357 182C384 165 370 145 357 159Z"/>
              <path d="M88 24L91 33L100 36L91 39L88 48L85 39L76 36L85 33ZM325 37L328 45L336 48L328 51L325 59L322 51L314 48L322 45Z"/>
            </g>
            <g fill="none" stroke="var(--theme-secondary)" opacity=".4">
              <path d="M19 178Q42 144 72 174Q45 179 34 199Q31 181 19 178ZM381 74Q358 40 328 70Q355 75 366 95Q369 77 381 74Z"/>
            </g>
            <g fill="var(--theme-text)" opacity=".48"><circle cx="111" cy="67" r="1.5"/><circle cx="281" cy="119" r="1.2"/><circle cx="185" cy="31" r="1"/></g>
          </svg>
        }
        @case ('emo') {
          <svg class="motif motif-full emo-rain" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g stroke="var(--theme-primary)" opacity=".22">
              <path d="M31 0L15 55M83 0L66 66M140 0L121 70M205 0L185 73M271 0L251 70M335 0L316 66M390 0L374 57"/>
              <path d="M61 100L39 174M149 96L126 180M251 94L229 172M353 98L331 177"/>
            </g>
            <path d="M52 149C26 119 0 157 52 193C104 157 78 119 52 149ZM52 149L38 162L58 169L46 180" fill="none" stroke="var(--theme-secondary)" opacity=".43"/>
            <path d="M329 45Q344 64 329 78Q314 64 329 45Z" fill="var(--theme-primary)" opacity=".4"/>
          </svg>
        }
        @case ('spooky-gay') {
          <svg class="motif motif-full spooky-pride" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g class="rainbow" fill="none" stroke-width="3" opacity=".34">
              <path d="M-30 195Q58 90 146 195" stroke="#ef476f"/><path d="M-25 201Q58 101 141 201" stroke="#ffd166"/>
              <path d="M-20 207Q58 112 136 207" stroke="#5ec979"/><path d="M-15 213Q58 123 131 213" stroke="#4aa8e9"/>
              <path d="M254 195Q342 90 430 195" stroke="#b563d4"/>
            </g>
            <g fill="var(--theme-text)" opacity=".45">
              <path d="M30 41Q43 28 56 41L49 38L43 47L37 38Z"/><path d="M337 55Q351 40 365 55L357 52L351 62L344 52Z"/>
            </g>
            <g class="ghost" transform="translate(345 157)" fill="none" stroke="var(--theme-secondary)" opacity=".5">
              <path d="M-20 20V-3A20 20 0 0 1 20-3V20L12 13L5 20L-3 13L-11 20L-20 13Z"/>
              <circle cx="-7" cy="-4" r="2" fill="var(--theme-secondary)"/><circle cx="7" cy="-4" r="2" fill="var(--theme-secondary)"/>
            </g>
            <g transform="translate(210 38)" fill="var(--theme-primary)" opacity=".55"><path d="M0-12L3-3L12 0L3 3L0 12L-3 3L-12 0L-3-3Z"/></g>
          </svg>
        }
      }
    </div>
  `,
  styles: [
    `
      .backdrop { overflow: hidden; }
      .warm-light {
        background:
          radial-gradient(70% 22% at 50% -7%, color-mix(in srgb, #ffe7b0 80%, transparent), transparent 72%),
          radial-gradient(24% 76% at -5% 50%, color-mix(in srgb, #e4b766 54%, transparent), transparent 76%),
          radial-gradient(24% 76% at 105% 50%, color-mix(in srgb, #e4b766 54%, transparent), transparent 76%),
          radial-gradient(64% 22% at 50% 107%, color-mix(in srgb, #d99f50 44%, transparent), transparent 75%);
      }
      .glow {
        background:
          radial-gradient(34% 27% at 8% 91%, color-mix(in srgb, var(--theme-glow-a) 45%, transparent), transparent 72%),
          radial-gradient(36% 28% at 92% 88%, color-mix(in srgb, var(--theme-glow-b) 45%, transparent), transparent 74%),
          radial-gradient(52% 28% at 50% 106%, color-mix(in srgb, var(--theme-glow-c) 38%, transparent), transparent 76%);
      }
      [data-motif='bare'] .glow { opacity: 0 !important; }
      .ambient { opacity: .34; mix-blend-mode: screen; }
      [data-motif='mushroom'] .ambient { background: radial-gradient(ellipse at 50% 108%, color-mix(in srgb, var(--theme-secondary) 16%, transparent), transparent 52%); }
      [data-motif='occult'] .ambient { background: radial-gradient(circle at 50% 54%, color-mix(in srgb, var(--theme-secondary) 16%, transparent), transparent 38%); animation: breathe 9s ease-in-out infinite alternate; }
      [data-motif='star-wars'] .ambient { background: linear-gradient(100deg, transparent 38%, color-mix(in srgb, var(--theme-info) 9%, transparent) 49%, transparent 60%); animation: scan 14s ease-in-out infinite; }
      [data-motif='warhammer'] .ambient { background: radial-gradient(ellipse at 50% 105%, color-mix(in srgb, var(--theme-secondary) 16%, transparent), transparent 56%); animation: breathe 12s ease-in-out infinite alternate; }
      [data-motif='pinkie'] .ambient { background: radial-gradient(ellipse at 50% 110%, color-mix(in srgb, var(--theme-primary) 20%, transparent), transparent 60%); animation: breathe 8s ease-in-out infinite alternate; }
      [data-motif='emo'] .ambient { background: linear-gradient(104deg, transparent 15%, color-mix(in srgb, var(--theme-secondary) 16%, transparent), transparent 62%); }
      [data-motif='spooky-gay'] .ambient { background: conic-gradient(from 220deg at 50% 120%, #ef476f1f, #ffd1661f, #5ec9791f, #4aa8e91f, #b563d41f, transparent 72%); animation: hue-drift 12s ease-in-out infinite alternate; }
      .motif { position: absolute; inset-inline: 0; bottom: 0; width: 100%; pointer-events: none; }
      .motif-floor { height: 43%; }
      .motif-full { inset-block: 0; height: 100%; }
      .ritual-wheel { transform-origin: 200px 112px; animation: rotate 90s linear infinite; }
      .star-field { animation: twinkle 6s ease-in-out infinite alternate; }
      .cutie-sparkles { animation: twinkle 4s ease-in-out infinite alternate; }
      .emo-rain { animation: rain 6s linear infinite; }
      .ghost { animation: float 5s ease-in-out infinite alternate; }
      @keyframes breathe { from { opacity: .55; } to { opacity: 1; } }
      @keyframes scan { 0%, 20% { transform: translateX(-22%); } 80%, 100% { transform: translateX(22%); } }
      @keyframes hue-drift { from { filter: hue-rotate(-8deg); } to { filter: hue-rotate(15deg); } }
      @keyframes twinkle { from { opacity: .55; } to { opacity: 1; } }
      @keyframes rain { from { transform: translateY(-5%); } to { transform: translateY(5%); } }
      @keyframes float { from { transform: translate(345px, 157px); } to { transform: translate(345px, 151px); } }
      @keyframes rotate { to { transform: translate(200px, 112px) rotate(360deg); } }
    `,
  ],
})
export class Background {
  readonly settings = inject(SettingsService);
  readonly onFactor = computed(() => (this.settings.bgOn() ? 1 : 0));
  readonly light = computed(() => this.settings.bgLight() / 100);
}
