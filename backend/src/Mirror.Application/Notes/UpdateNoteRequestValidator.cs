using FluentValidation;

namespace Mirror.Application.Notes;

public sealed class UpdateNoteRequestValidator : AbstractValidator<UpdateNoteRequest>
{
    public UpdateNoteRequestValidator()
    {
        RuleFor(request => request.Text)
            .MaximumLength(10_000)
            .WithMessage("A note cannot be longer than 10,000 characters.");
    }
}
