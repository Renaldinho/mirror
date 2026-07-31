using Mirror.Domain.Entities;

namespace Mirror.Application.Notes;

internal static class NoteMappings
{
    public static NoteDto ToDto(this Note note) => new(note.Text, note.UpdatedAt);
}
