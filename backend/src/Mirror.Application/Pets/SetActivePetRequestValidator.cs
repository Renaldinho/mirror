using FluentValidation;
using Mirror.Domain.Pets;

namespace Mirror.Application.Pets;

public sealed class SetActivePetRequestValidator : AbstractValidator<SetActivePetRequest>
{
    public SetActivePetRequestValidator()
    {
        RuleFor(request => request.PetId)
            .Must(petId => PetCatalog.Contains((petId ?? string.Empty).Trim()))
            .WithMessage("Choose a known pet or an empty value to dismiss the active pet.");
    }
}
