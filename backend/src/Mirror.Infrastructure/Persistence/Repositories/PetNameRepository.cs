using Microsoft.EntityFrameworkCore;
using Mirror.Application.Pets;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence.Repositories;

public sealed class PetNameRepository(AppDbContext db) : IPetNameRepository
{
    public async Task<IReadOnlyList<PetName>> GetAllAsync(CancellationToken cancellationToken = default)
        => await db.PetNames.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<PetName?> FindAsync(string petId, CancellationToken cancellationToken = default)
        => await db.PetNames.FindAsync([petId], cancellationToken);

    public void Add(PetName petName) => db.PetNames.Add(petName);
}
