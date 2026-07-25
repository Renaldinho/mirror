import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { PetService } from '../pet.service';

interface MoodRecord {
  /** energy value captured at `ts` (decays with elapsed time). */
  energy: number;
  ts: number;
}

const STORAGE_KEY = 'dash.pet.mood';
const DEFAULT_ENERGY = 70;
const FEED_AMOUNT = 34;
/** Full 100 → 0 drain over roughly eight hours. */
const DECAY_PER_MS = 100 / (8 * 3600 * 1000);

/**
 * Per-pet energy, persisted and decayed over real time. PetService persists names
 * through the backend. Energy re-weights
 * which *existing* sprite states run (see Pet.chooseNext) — no new animation.
 * The active pet is whichever PetService has selected.
 */
@Injectable({ providedIn: 'root' })
export class PetMoodService {
  private readonly pets = inject(PetService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly records = signal<Record<string, MoodRecord>>(this.load());
  /** ticks so `energy` recomputes as time passes. */
  private readonly clock = signal(Date.now());

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records())));
    const timer = setInterval(() => this.clock.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  /** Live energy (0..100) of the active pet, decayed to now. */
  readonly energy = computed(() => {
    this.clock();
    const id = this.pets.petId();
    if (!id) return 0;
    return this.decay(this.records()[id], Date.now());
  });

  readonly name = this.pets.activeName;

  /** Feed the active pet: bake in decay so far, then top up energy. */
  feed(): void {
    const id = this.pets.petId();
    if (!id) return;
    const now = Date.now();
    const current = this.decay(this.records()[id], now);
    this.write(id, { energy: Math.min(100, current + FEED_AMOUNT), ts: now });
  }

  setName(name: string): void {
    const id = this.pets.petId();
    if (!id) return;
    this.pets.setName(id, name);
  }

  private write(id: string, record: MoodRecord): void {
    this.records.update((all) => ({ ...all, [id]: record }));
  }

  private decay(record: MoodRecord | undefined, now: number): number {
    if (!record) return DEFAULT_ENERGY;
    const elapsed = Math.max(0, now - record.ts);
    return Math.max(0, Math.min(100, record.energy - elapsed * DECAY_PER_MS));
  }

  private load(): Record<string, MoodRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, MoodRecord>) : {};
    } catch {
      return {};
    }
  }
}
