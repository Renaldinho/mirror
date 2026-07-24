import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { QuoteWidget } from './quote';

function todayKey(): string {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

describe('QuoteWidget', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [QuoteWidget],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches and caches one fresh daily quote', () => {
    const fixture = TestBed.createComponent(QuoteWidget);
    const request = http.expectOne('https://dummyjson.com/quotes/random');

    request.flush({ id: 42, quote: '  A fresh thought.  ', author: '  Ada  ' });

    expect(fixture.componentInstance.quote()).toEqual({
      text: 'A fresh thought.',
      author: 'Ada',
    });
    expect(JSON.parse(localStorage.getItem('dash.quote.daily.v1')!)).toEqual({
      date: todayKey(),
      quote: { text: 'A fresh thought.', author: 'Ada' },
    });
  });

  it('uses today’s cached quote without another request', () => {
    localStorage.setItem(
      'dash.quote.daily.v1',
      JSON.stringify({
        date: todayKey(),
        quote: { text: 'Already chosen for today.', author: 'The Mirror' },
      }),
    );

    const fixture = TestBed.createComponent(QuoteWidget);

    expect(fixture.componentInstance.quote()).toEqual({
      text: 'Already chosen for today.',
      author: 'The Mirror',
    });
    expect(http.match('https://dummyjson.com/quotes/random')).toHaveLength(0);
  });

  it('keeps an offline fallback when the service is unavailable', () => {
    const fixture = TestBed.createComponent(QuoteWidget);
    const request = http.expectOne('https://dummyjson.com/quotes/random');
    request.flush(null, { status: 503, statusText: 'Unavailable' });

    expect(fixture.componentInstance.quote().text.length).toBeGreaterThan(0);
    expect(localStorage.getItem('dash.quote.daily.v1')).toBeNull();
  });
});
