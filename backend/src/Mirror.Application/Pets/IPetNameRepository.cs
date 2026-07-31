using Mirror.Domain.Entities;

namespace Mirror.Application.Pets;

public interface IPetNameRepository
{
    Task<IReadOnlyList<PetName>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PetName?> FindAsync(string petId, CancellationToken cancellationToken = default);
    void Add(PetName petName);
}
