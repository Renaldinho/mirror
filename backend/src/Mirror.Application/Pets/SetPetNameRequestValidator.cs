using FluentValidation;

namespace Mirror.Application.Pets;

public sealed class SetPetNameRequestValidator : AbstractValidator<SetPetNameRequest>
{
    public SetPetNameRequestValidator()
    {
        RuleFor(request => request.Name)
            .Must(name => (name ?? string.Empty).Trim().Length <= 24)
            .WithMessage("A pet name cannot be longer than 24 characters.");
    }
}
