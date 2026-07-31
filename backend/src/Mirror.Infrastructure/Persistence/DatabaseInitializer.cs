using Microsoft.EntityFrameworkCore;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence;

public interface IDatabaseInitializer
{
    Task InitialiseAsync(CancellationToken cancellationToken = default);
}

/// <summary>Applies migrations and seeds the singleton note and preferences rows.</summary>
public sealed class DatabaseInitializer(AppDbContext db) : IDatabaseInitializer
{
    public async Task InitialiseAsync(CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);

        var changed = false;
        if (await db.Notes.FindAsync([Note.SharedId], cancellationToken) is null)
        {
            db.Notes.Add(new Note
            {
                Id = Note.SharedId,
                Text = "",
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            changed = true;
        }

        if (await db.MirrorPreferences.FindAsync([MirrorPreference.SharedId], cancellationToken) is null)
        {
            db.MirrorPreferences.Add(new MirrorPreference
            {
                Id = MirrorPreference.SharedId,
                ActivePetId = "",
                UpdatedAt = DateTimeOffset.UtcNow,
            });
            changed = true;
        }

        if (changed)
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
