namespace Mirror.Application.Pets;

public sealed record PetsDto(string ActivePetId, IReadOnlyDictionary<string, string> Names);

public sealed record ActivePetDto(string PetId, DateTimeOffset UpdatedAt);

public sealed record PetNameDto(string PetId, string Name, DateTimeOffset UpdatedAt);

public sealed record SetActivePetRequest(string? PetId);

public sealed record SetPetNameRequest(string? Name);
