import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { PET_CATALOG, PetInfo } from './pets';

export type PetKind = PetInfo;

/** The critters she can choose from (shared with the pet factory). */
export const PETS = PET_CATALOG;

interface PetsDto {
  activePetId: string;
  names: Record<string, string>;
}

interface LegacyMoodRecord {
  name?: string;
}

const PETS_URL = '/api/pets';
const PET_CACHE_KEY = 'dash.pet';
const NAMES_CACHE_KEY = 'dash.pet.names';

function initialPetId(): string {
  const stored = localStorage.getItem(PET_CACHE_KEY) ?? '';
  const migrated =
    stored === 'cat' || stored === 'shadow-cat'
      ? 'shadow-kit'
      : stored === 'puppy' || stored === 'collie'
        ? 'lando'
        : stored;
  return PETS.some((pet) => pet.id === migrated) ? migrated : '';
}

/** Persisted pet selection and names, with a browser cache for backend outages. */
@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly nameTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly petId = signal(initialPetId());
  readonly names = signal<Record<string, string>>(this.loadCachedNames());
  readonly kind = computed<PetInfo | null>(() => PETS.find((pet) => pet.id === this.petId()) ?? null);
  readonly activeName = computed(() => this.names()[this.petId()] ?? '');

  constructor() {
    effect(() => localStorage.setItem(PET_CACHE_KEY, this.petId()));
    effect(() => localStorage.setItem(NAMES_CACHE_KEY, JSON.stringify(this.names())));
    this.destroyRef.onDestroy(() => {
      for (const timer of this.nameTimers.values()) clearTimeout(timer);
    });
    void this.load();
  }

  /** Click a critter to summon it; click the active one to dismiss it. */
  select(id: string): void {
    const next = this.petId() === id ? '' : id;
    this.petId.set(next);
    void this.saveActive(next);
  }

  nameFor(id: string): string {
    return this.names()[id] ?? '';
  }

  setName(id: string, value: string): void {
    if (!PETS.some((pet) => pet.id === id)) return;
    const name = value.slice(0, 24);
    this.names.update((all) => ({ ...all, [id]: name }));
    clearTimeout(this.nameTimers.get(id));
    this.nameTimers.set(id, setTimeout(() => {
      this.nameTimers.delete(id);
      void this.saveName(id, name);
    }, 300));
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch(PETS_URL);
      if (!response.ok) return;
      const state = await response.json() as PetsDto;
      const activePetId = PETS.some((pet) => pet.id === state.activePetId)
        ? state.activePetId
        : '';
      const serverNames = Object.fromEntries(
        Object.entries(state.names ?? {})
          .filter(([id]) => PETS.some((pet) => pet.id === id))
          .map(([id, name]) => [id, String(name).slice(0, 24)]),
      );

      // Adopt browser-only prototype values once, but never overwrite values
      // which have already reached SQLite.
      const cachedActive = this.petId();
      if (!activePetId && cachedActive) {
        await this.saveActive(cachedActive);
      } else {
        this.petId.set(activePetId);
      }

      const missingNames = Object.fromEntries(
        Object.entries({ ...this.loadLegacyNames(), ...this.names() })
          .filter(([id, name]) =>
            PETS.some((pet) => pet.id === id) && !!name && !(id in serverNames)),
      );
      this.names.set({ ...missingNames, ...serverNames });
      await Promise.all(
        Object.entries(missingNames).map(([id, name]) => this.saveName(id, name)),
      );
    } catch {
      // Keep the browser cache until the backend is available again.
    }
  }

  private async saveActive(petId: string): Promise<void> {
    try {
      await fetch(`${PETS_URL}/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId }),
      });
    } catch {
      // The browser cache preserves the selection for a later reload.
    }
  }

  private async saveName(petId: string, name: string): Promise<void> {
    try {
      await fetch(`${PETS_URL}/${encodeURIComponent(petId)}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch {
      // The browser cache preserves the name for a later migration/reload.
    }
  }

  private loadCachedNames(): Record<string, string> {
    try {
      const raw = localStorage.getItem(NAMES_CACHE_KEY);
      return raw ? JSON.parse(raw) as Record<string, string> : this.loadLegacyNames();
    } catch {
      return {};
    }
  }

  private loadLegacyNames(): Record<string, string> {
    try {
      const raw = localStorage.getItem('dash.pet.mood');
      if (!raw) return {};
      const records = JSON.parse(raw) as Record<string, LegacyMoodRecord>;
      return Object.fromEntries(
        Object.entries(records)
          .filter(([id, record]) => PETS.some((pet) => pet.id === id) && !!record.name)
          .map(([id, record]) => [id, record.name!.slice(0, 24)]),
      );
    } catch {
      return {};
    }
  }
}
