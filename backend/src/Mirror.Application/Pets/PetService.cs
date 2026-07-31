using FluentValidation;
using Mirror.Application.Common;
using Mirror.Application.Common.Exceptions;
using Mirror.Domain.Entities;
using Mirror.Domain.Pets;

namespace Mirror.Application.Pets;

public sealed class PetService(
    IMirrorPreferenceRepository preferences,
    IPetNameRepository petNames,
    IUnitOfWork unitOfWork,
    IValidator<SetActivePetRequest> activeValidator,
    IValidator<SetPetNameRequest> nameValidator) : IPetService
{
    public async Task<PetsDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var preference = await preferences.GetSharedAsync(cancellationToken);
        var names = await petNames.GetAllAsync(cancellationToken);
        var map = names.ToDictionary(petName => petName.PetId, petName => petName.Name);
        return new PetsDto(preference.ActivePetId, map);
    }

    public async Task<ActivePetDto> SetActiveAsync(SetActivePetRequest request, CancellationToken cancellationToken = default)
    {
        await activeValidator.ValidateAndThrowAsync(request, cancellationToken);

        var preference = await preferences.GetSharedAsync(cancellationToken);
        preference.ActivePetId = (request.PetId ?? "").Trim();
        preference.UpdatedAt = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new ActivePetDto(preference.ActivePetId, preference.UpdatedAt);
    }

    public async Task<PetNameDto> SetNameAsync(string petId, SetPetNameRequest request, CancellationToken cancellationToken = default)
    {
        if (!PetCatalog.Contains(petId))
        {
            throw new NotFoundException($"Unknown pet '{petId}'.");
        }

        await nameValidator.ValidateAndThrowAsync(request, cancellationToken);

        var name = (request.Name ?? "").Trim();
        var petName = await petNames.FindAsync(petId, cancellationToken);
        if (petName is null)
        {
            petName = new PetName { PetId = petId };
            petNames.Add(petName);
        }

        petName.Name = name;
        petName.UpdatedAt = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new PetNameDto(petName.PetId, petName.Name, petName.UpdatedAt);
    }
}
