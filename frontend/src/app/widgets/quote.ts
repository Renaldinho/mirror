import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

interface Quote {
  text: string;
  author: string;
}

/** A small curated, offline set — dark-academia / literary in flavour. */
const QUOTES: Quote[] = [
  { text: 'We are all in the gutter, but some of us are looking at the stars.', author: 'Oscar Wilde' },
  { text: 'I took a deep breath and listened to the old brag of my heart. I am, I am, I am.', author: 'Sylvia Plath' },
  { text: 'The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.', author: 'John Milton' },
  { text: 'Beauty is truth, truth beauty — that is all ye know on earth, and all ye need to know.', author: 'John Keats' },
  { text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', author: 'Jane Austen' },
  { text: 'Tyger Tyger, burning bright, in the forests of the night.', author: 'William Blake' },
  { text: 'And, when you want something, all the universe conspires in helping you to achieve it.', author: 'Paulo Coelho' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Brontë' },
  { text: 'To die will be an awfully big adventure.', author: 'J.M. Barrie' },
  { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R.R. Martin' },
  { text: 'There is no greater agony than bearing an untold story inside you.', author: 'Maya Angelou' },
];

/** Quote of the day — stable within a calendar day, advances daily. */
@Component({
  selector: 'app-quote',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col justify-center gap-4 px-2">
      <p class="text-lg italic leading-relaxed text-parchment">“{{ quote().text }}”</p>
      <p class="text-right text-sm uppercase tracking-[0.2em] text-gold">— {{ quote().author }}</p>
    </div>
  `,
})
export class QuoteWidget {
  readonly quote = computed<Quote>(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    return QUOTES[dayOfYear % QUOTES.length];
  });
}
