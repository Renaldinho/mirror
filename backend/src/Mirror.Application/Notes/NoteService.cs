using FluentValidation;
using Mirror.Application.Common;

namespace Mirror.Application.Notes;

public sealed class NoteService(
    INoteRepository repository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateNoteRequest> validator) : INoteService
{
    public async Task<NoteDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var note = await repository.GetSharedAsync(cancellationToken);
        return note.ToDto();
    }

    public async Task<NoteDto> UpdateAsync(UpdateNoteRequest request, CancellationToken cancellationToken = default)
    {
        await validator.ValidateAndThrowAsync(request, cancellationToken);

        var note = await repository.GetSharedAsync(cancellationToken);
        note.Text = request.Text ?? "";
        note.UpdatedAt = DateTimeOffset.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return note.ToDto();
    }
}
