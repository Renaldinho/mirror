import { TestBed } from '@angular/core/testing';
import { GamesService } from './games.service';

describe('GamesService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('restores the normal cursor when a game closes', () => {
    const games = TestBed.inject(GamesService);
    games.open('duck-hunt');
    games.gameCursorSuppressed.set(true);

    games.close();

    expect(games.activeGame()).toBeNull();
    expect(games.gameCursorSuppressed()).toBe(false);
  });
});
