namespace Mirror.Application.Notes;

public interface INoteService
{
    Task<NoteDto> GetAsync(CancellationToken cancellationToken = default);
    Task<NoteDto> UpdateAsync(UpdateNoteRequest request, CancellationToken cancellationToken = default);
}
