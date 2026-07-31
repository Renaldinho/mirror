using Mirror.Domain.Entities;

namespace Mirror.Application.Notes;

public interface INoteRepository
{
    /// <summary>The single shared note row (seeded at startup).</summary>
    Task<Note> GetSharedAsync(CancellationToken cancellationToken = default);
}
