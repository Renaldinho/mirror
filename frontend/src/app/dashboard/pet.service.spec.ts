import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PetService } from './pet.service';

describe('PetService persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      activePetId: 'frog',
      names: { frog: 'Fern' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('loads the active pet and names from the backend', async () => {
    const service = TestBed.inject(PetService);

    await vi.waitFor(() => expect(service.petId()).toBe('frog'));

    expect(service.activeName()).toBe('Fern');
  });

  it('persists pet selection and names through REST', async () => {
    const service = TestBed.inject(PetService);
    await vi.waitFor(() => expect(service.petId()).toBe('frog'));
    vi.mocked(fetch).mockClear();

    service.select('capy');
    service.setName('capy', 'Biscuit');

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenCalledWith('/api/pets/active', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ petId: 'capy' }),
    }));
    expect(fetch).toHaveBeenCalledWith('/api/pets/capy/name', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ name: 'Biscuit' }),
    }));
  });
});
