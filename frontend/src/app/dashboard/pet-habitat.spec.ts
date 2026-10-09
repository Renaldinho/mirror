import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PetHabitat } from './pet-habitat';
import { PetService } from './pet.service';
import { PetMoodService } from './pets/pet-mood.service';
import { PetCozyService } from './pets/pet-cozy.service';

describe('pet habitat pointer work', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('does not check the habitat on idle mouse moves but still moves and drops items', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [PetHabitat],
      providers: [
        { provide: PetService, useValue: { kind: signal(null) } },
        { provide: PetMoodService, useValue: { name: signal('') } },
      ],
    });
    const fixture = TestBed.createComponent(PetHabitat);
    const cozy = TestBed.inject(PetCozyService);
    const item = { id: 'cozy-bed', type: 'bed' as const, x: 100, y: 150 };
    cozy.items.set([item]);
    fixture.detectChanges();
    await fixture.whenStable();
    const style = vi.spyOn(fixture.componentInstance, 'itemStyle');
    const pointer = (type: string, x: number, y: number) =>
      Object.assign(new Event(type), { button: 0, clientX: x, clientY: y }) as PointerEvent;
    window.dispatchEvent(pointer('pointermove', 400, 300));
    await fixture.whenStable();
    expect(style).not.toHaveBeenCalled();

    cozy.editing.set(true);
    fixture.componentInstance.beginMove(pointer('pointerdown', 110, 160), item);
    window.dispatchEvent(pointer('pointermove', 210, 260));
    expect(fixture.componentInstance.preview()).toMatchObject({ x: 200, y: 250 });
    window.dispatchEvent(pointer('pointerup', 210, 260));
    expect(cozy.items()[0]).toMatchObject({ x: 200, y: 250 });
    expect(fixture.componentInstance.preview()).toBeNull();

    const remove = vi.spyOn(window, 'removeEventListener');
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointercancel', expect.any(Function));
  });
});
