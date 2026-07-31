using Mirror.Application.Notes;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence.Repositories;

public sealed class NoteRepository(AppDbContext db) : INoteRepository
{
    public async Task<Note> GetSharedAsync(CancellationToken cancellationToken = default)
        => await db.Notes.FindAsync([Note.SharedId], cancellationToken)
           ?? throw new InvalidOperationException("The shared note row is missing.");
}
