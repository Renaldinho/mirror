namespace Mirror.Application.Pets;

public interface IPetService
{
    Task<PetsDto> GetAsync(CancellationToken cancellationToken = default);
    Task<ActivePetDto> SetActiveAsync(SetActivePetRequest request, CancellationToken cancellationToken = default);
    Task<PetNameDto> SetNameAsync(string petId, SetPetNameRequest request, CancellationToken cancellationToken = default);
}
