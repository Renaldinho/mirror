import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { PetService } from '../pet.service';

interface MoodRecord {
  /** energy value captured at `ts` (decays with elapsed time). */
  energy: number;
  name: string;
  ts: number;
}

const STORAGE_KEY = 'dash.pet.mood';
const DEFAULT_ENERGY = 70;
const FEED_AMOUNT = 34;
/** Full 100 → 0 drain over roughly eight hours. */
const DECAY_PER_MS = 100 / (8 * 3600 * 1000);

/**
 * Per-pet energy + name, persisted and decayed over real time. Energy re-weights
 * which *existing* sprite states run (see Pet.chooseNext) — no new animation.
 * The active pet is whichever PetService has selected.
 */
@Injectable({ providedIn: 'root' })
export class PetMoodService {
  private readonly pets = inject(PetService);
  private readonly records = signal<Record<string, MoodRecord>>(this.load());
  /** ticks so `energy` recomputes as time passes. */
  private readonly clock = signal(Date.now());

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records())));
    setInterval(() => this.clock.set(Date.now()), 60_000);
  }

  /** Live energy (0..100) of the active pet, decayed to now. */
  readonly energy = computed(() => {
    this.clock();
    const id = this.pets.petId();
    if (!id) return 0;
    return this.decay(this.records()[id], Date.now());
  });

  readonly name = computed(() => {
    const id = this.pets.petId();
    return id ? (this.records()[id]?.name ?? '') : '';
  });

  /** Feed the active pet: bake in decay so far, then top up energy. */
  feed(): void {
    const id = this.pets.petId();
    if (!id) return;
    const now = Date.now();
    const current = this.decay(this.records()[id], now);
    this.write(id, { energy: Math.min(100, current + FEED_AMOUNT), name: this.name(), ts: now });
  }

  setName(name: string): void {
    const id = this.pets.petId();
    if (!id) return;
    const now = Date.now();
    const current = this.decay(this.records()[id], now);
    this.write(id, { energy: current, name: name.slice(0, 24), ts: now });
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
