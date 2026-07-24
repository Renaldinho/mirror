import { Injectable, computed, effect, signal } from '@angular/core';

export interface PetKind {
  id: string;
  emoji: string;
  label: string;
}

/** The critters she can choose from. Emoji-based so it works with no assets. */
export const PETS: PetKind[] = [
  { id: 'cat', emoji: '🐈', label: 'Cat' },
  { id: 'puppy', emoji: '🐕', label: 'Puppy' },
  { id: 'spider', emoji: '🕷️', label: 'Spider' },
  { id: 'moth', emoji: '🦋', label: 'Moth' },
  { id: 'frog', emoji: '🐸', label: 'Frog' },
  { id: 'snail', emoji: '🐌', label: 'Snail' },
];

/** Which desktop pet is roaming (empty = none). Persisted. */
@Injectable({ providedIn: 'root' })
export class PetService {
  readonly petId = signal(localStorage.getItem('dash.pet') ?? '');
  readonly kind = computed<PetKind | null>(() => PETS.find((p) => p.id === this.petId()) ?? null);

  constructor() {
    effect(() => localStorage.setItem('dash.pet', this.petId()));
  }

  /** Click a critter to summon it; click the active one to dismiss it. */
  select(id: string): void {
    this.petId.set(this.petId() === id ? '' : id);
  }
}
