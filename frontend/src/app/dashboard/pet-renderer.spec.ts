import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PetRenderer } from './pet-renderer';
import { PetService } from './pet.service';
import { PetMoodService } from './pets/pet-mood.service';
import { SpotifyService } from '../widgets/spotify/spotify.service';
import { GamesService } from '../minigames/games.service';

describe('pet rendering', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('moves orbiting and dragged controls with transforms and cancels its loop on destroy', () => {
    localStorage.clear();
    let frame: FrameRequestCallback = () => {};
    const request = vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', request);
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const spotify = { authed: signal(true), track: signal({ id: 'test' }), paused: signal(true) };
    TestBed.configureTestingModule({
      imports: [PetRenderer],
      providers: [
        { provide: PetService, useValue: { petId: signal('capy') } },
        { provide: PetMoodService, useValue: { energy: signal(70), name: signal(''), feed: vi.fn() } },
        { provide: SpotifyService, useValue: spotify },
      ],
    });
    const fixture = TestBed.createComponent(PetRenderer);
    fixture.detectChanges();
    frame(1000);
    const food = fixture.nativeElement.querySelector('.food-button') as HTMLElement;
    const initial = food.style.transform;
    expect(initial).toMatch(/^translate\(/);
    frame(1016);
    frame(1033);
    expect(food.style.transform).toBe(initial);
    frame(1100);
    expect(food.style.transform).not.toBe(initial);

    food.dispatchEvent(Object.assign(new Event('pointerdown'), { button: 0, clientX: 300, clientY: 200 }));
    frame(1200);
    const root = fixture.nativeElement.querySelector('.pet-root') as HTMLElement;
    const [x, y] = root.style.transform.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(food.style.transform).toBe(`translate(${300 - x - 12}px, ${200 - y - 12}px)`);
    expect(food.style.left).toBe('');
    expect(food.style.top).toBe('');
    spotify.paused.set(false);
    frame(1300);
    expect(fixture.nativeElement.querySelector('.bubble').textContent).toBe('♫');
    const visual = fixture.nativeElement.querySelector('.visual') as HTMLElement;
    expect(visual.classList.contains('pet-sprite-capy-dance')).toBe(true);
    expect(visual.style.backgroundSize).toBe('320px 640px');
    const geometry = [visual.style.width, visual.style.height, visual.style.top];
    frame(1500);
    expect([visual.style.width, visual.style.height, visual.style.top]).toEqual(geometry);
    spotify.paused.set(true);
    frame(1600);
    expect(fixture.nativeElement.querySelector('.bubble').textContent).toBe('');
    const games = TestBed.inject(GamesService);
    const petFrame = frame;
    const petRequests = () => request.mock.calls.filter(([callback]) => callback === petFrame).length;
    games.open('whack');
    fixture.detectChanges();
    expect(cancel).toHaveBeenCalledWith(1);
    const requests = petRequests();
    const beforeGame = food.style.transform;
    petFrame(1800);
    expect(petRequests()).toBe(requests);
    expect(food.style.transform).toBe(beforeGame);
    games.close();
    fixture.detectChanges();
    expect(petRequests()).toBe(requests + 1);
    petFrame(3000);
    expect(fixture.nativeElement.querySelector('.bubble').textContent).toBe('');
    fixture.destroy();
    expect(cancel).toHaveBeenCalledWith(1);
  });
});
