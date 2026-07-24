import { Injectable, computed, effect, signal } from '@angular/core';
import { PET_CATALOG, PetInfo } from './pets';

export type PetKind = PetInfo;

/** The critters she can choose from (shared with the pet factory). */
export const PETS = PET_CATALOG;

function initialPetId(): string {
  const stored = localStorage.getItem('dash.pet') ?? '';
  const migrated =
    stored === 'cat' || stored === 'shadow-cat'
      ? 'shadow-kit'
      : stored === 'puppy' || stored === 'collie'
        ? 'lando'
        : stored;
  return PETS.some((pet) => pet.id === migrated) ? migrated : '';
}

/** Which desktop pet is roaming (empty = none). Persisted. */
@Injectable({ providedIn: 'root' })
export class PetService {
  readonly petId = signal(initialPetId());
  readonly kind = computed<PetInfo | null>(() => PETS.find((p) => p.id === this.petId()) ?? null);

  constructor() {
    effect(() => localStorage.setItem('dash.pet', this.petId()));
  }

  /** Click a critter to summon it; click the active one to dismiss it. */
  select(id: string): void {
    this.petId.set(this.petId() === id ? '' : id);
  }
}
