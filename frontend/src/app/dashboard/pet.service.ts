import { Injectable, computed, effect, signal } from '@angular/core';
import { PET_CATALOG, PetInfo } from './pets';

export type PetKind = PetInfo;

/** The critters she can choose from (shared with the pet factory). */
export const PETS = PET_CATALOG;

/** Which desktop pet is roaming (empty = none). Persisted. */
@Injectable({ providedIn: 'root' })
export class PetService {
  readonly petId = signal(localStorage.getItem('dash.pet') ?? '');
  readonly kind = computed<PetInfo | null>(() => PETS.find((p) => p.id === this.petId()) ?? null);

  constructor() {
    effect(() => localStorage.setItem('dash.pet', this.petId()));
  }

  /** Click a critter to summon it; click the active one to dismiss it. */
  select(id: string): void {
    this.petId.set(this.petId() === id ? '' : id);
  }
}
