using Mirror.Domain.Entities;

namespace Mirror.Application.Pets;

public interface IMirrorPreferenceRepository
{
    /// <summary>The single shared preferences row (seeded at startup).</summary>
    Task<MirrorPreference> GetSharedAsync(CancellationToken cancellationToken = default);
}
