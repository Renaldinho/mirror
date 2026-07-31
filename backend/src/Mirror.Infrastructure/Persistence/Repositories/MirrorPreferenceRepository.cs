using Mirror.Application.Pets;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence.Repositories;

public sealed class MirrorPreferenceRepository(AppDbContext db) : IMirrorPreferenceRepository
{
    public async Task<MirrorPreference> GetSharedAsync(CancellationToken cancellationToken = default)
        => await db.MirrorPreferences.FindAsync([MirrorPreference.SharedId], cancellationToken)
           ?? throw new InvalidOperationException("The shared preferences row is missing.");
}
