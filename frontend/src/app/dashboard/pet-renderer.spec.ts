import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PetRenderer } from './pet-renderer';
import { PetService } from './pet.service';
import { PetMoodService } from './pets/pet-mood.service';

describe('pet rendering', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('moves orbiting and dragged controls with transforms and cancels its loop on destroy', () => {
    localStorage.clear();
    let frame: FrameRequestCallback = () => {};
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    }));
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    TestBed.configureTestingModule({
      imports: [PetRenderer],
      providers: [
        { provide: PetService, useValue: { petId: signal('capy') } },
        { provide: PetMoodService, useValue: { energy: signal(70), name: signal(''), feed: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(PetRenderer);
    fixture.detectChanges();
    frame(1000);
    const food = fixture.nativeElement.querySelector('.food-button') as HTMLElement;
    const initial = food.style.transform;
    expect(initial).toMatch(/^translate\(/);
    frame(1100);
    expect(food.style.transform).not.toBe(initial);

    food.dispatchEvent(Object.assign(new Event('pointerdown'), { button: 0, clientX: 300, clientY: 200 }));
    frame(1200);
    const root = fixture.nativeElement.querySelector('.pet-root') as HTMLElement;
    const [x, y] = root.style.transform.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(food.style.transform).toBe(`translate(${300 - x - 12}px, ${200 - y - 12}px)`);
    expect(food.style.left).toBe('');
    expect(food.style.top).toBe('');
    fixture.destroy();
    expect(cancel).toHaveBeenCalledWith(1);
  });
});
