import { Injectable, signal } from '@angular/core';

/**
 * UI-only state shared across the mirror shell: whether the reactive-particle
 * background is on, and whether the bottom-right chat panel is expanded. Kept
 * separate from WsService (which owns wire/domain state).
 */
@Injectable({ providedIn: 'root' })
export class UiService {
  /** Reactive-particle background on/off (blank when off). */
  readonly bgEnabled = signal(true);
  /** Bottom-right chat panel expanded/collapsed. */
  readonly chatOpen = signal(false);

  toggleBg(): void {
    this.bgEnabled.update((v) => !v);
  }

  toggleChat(): void {
    this.chatOpen.update((v) => !v);
  }
}
