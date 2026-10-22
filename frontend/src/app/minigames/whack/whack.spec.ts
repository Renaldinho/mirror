import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AudioFx } from '../audio';
import { Whack } from './whack';

describe('Whack-a-Mole bundled artwork', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [Whack], providers: [
      { provide: AudioFx, useValue: { play: vi.fn() } },
    ] });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('reveals a local image and hides it again after a successful whack', () => {
    const fixture = TestBed.createComponent(Whack);
    fixture.detectChanges();
    const images = fixture.nativeElement.querySelectorAll('img.mole') as NodeListOf<HTMLImageElement>;
    expect(images).toHaveLength(9);
    for (const image of images) {
      expect(image.getAttribute('src')).toBe('/games/whack/mole.svg');
      expect(image.draggable).toBe(false);
    }
    vi.advanceTimersByTime(1100);
    fixture.detectChanges();
    const hole = fixture.nativeElement.querySelector('.hole.up') as HTMLButtonElement;
    expect(hole.querySelector('img.mole')).not.toBeNull();
    hole.dispatchEvent(new Event('pointerdown'));
    fixture.detectChanges();
    expect(fixture.componentInstance.score()).toBe(1);
    expect(hole.classList.contains('up')).toBe(false);
    vi.advanceTimersByTime(30_000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.over')).not.toBeNull();
  });
});
