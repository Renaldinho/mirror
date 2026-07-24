import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

interface Quote {
  text: string;
  author: string;
}

interface ApiQuote {
  id: number;
  quote: string;
  author: string;
}

interface CachedQuote {
  date: string;
  quote: Quote;
}

const QUOTE_URL = 'https://dummyjson.com/quotes/random';
const CACHE_KEY = 'dash.quote.daily.v1';

/** Used only while offline or when the daily quote service cannot be reached. */
const FALLBACK_QUOTES: readonly Quote[] = [
  { text: 'We are all in the gutter, but some of us are looking at the stars.', author: 'Oscar Wilde' },
  { text: 'The clearest way into the Universe is through a forest wilderness.', author: 'John Muir' },
  { text: 'The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', author: 'John Milton' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'Nothing is so painful to the human mind as a great and sudden change.', author: 'Mary Shelley' },
  { text: 'I took a deep breath and listened to the old brag of my heart.', author: 'Sylvia Plath' },
];

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fallbackFor(dateKey: string): Quote {
  const value = [...dateKey].reduce((total, character) => total + character.charCodeAt(0), 0);
  return FALLBACK_QUOTES[value % FALLBACK_QUOTES.length];
}

/** Fetches one message per local calendar day, then serves it from local storage. */
@Component({
  selector: 'app-quote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col justify-center gap-4 px-2">
      <p class="text-lg italic leading-relaxed text-parchment">“{{ quote().text }}”</p>
      <p class="text-right text-sm uppercase tracking-[0.2em] text-gold">— {{ quote().author }}</p>
    </div>
  `,
  styles: [
    `
      p:first-child {
        display: -webkit-box;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 6;
      }
    `,
  ],
})
export class QuoteWidget {
  private readonly http = inject(HttpClient);
  private readonly today = localDateKey();

  readonly quote = signal<Quote>(fallbackFor(this.today));

  constructor() {
    const cached = this.loadCachedQuote();
    if (cached) {
      this.quote.set(cached);
      return;
    }

    this.http.get<ApiQuote>(QUOTE_URL).subscribe({
      next: (response) => {
        const quote = this.normalise(response);
        if (!quote) return;

        this.quote.set(quote);
        this.saveQuote(quote);
      },
      error: () => {
        // The immediate offline fallback remains visible.
      },
    });
  }

  private normalise(response: ApiQuote): Quote | null {
    const text = response.quote?.trim();
    const author = response.author?.trim();
    return text && author ? { text, author } : null;
  }

  private loadCachedQuote(): Quote | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const cached = JSON.parse(raw) as Partial<CachedQuote>;
      const text = cached.quote?.text?.trim();
      const author = cached.quote?.author?.trim();
      return cached.date === this.today && text && author ? { text, author } : null;
    } catch {
      return null;
    }
  }

  private saveQuote(quote: Quote): void {
    try {
      const cached: CachedQuote = { date: this.today, quote };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Storage can be unavailable in privacy modes; the quote still works for this session.
    }
  }
}
