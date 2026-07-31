using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Mirror.Application.Common;
using Mirror.Application.Notes;
using Mirror.Application.Pets;
using Mirror.Infrastructure.Persistence;
using Mirror.Infrastructure.Persistence.Repositories;

namespace Mirror.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string databasePath)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(databasePath)!);

        var connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = databasePath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared,
        }.ToString();

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlite(connectionString);
            // The baseline migration uses CREATE TABLE IF NOT EXISTS to adopt the
            // earlier prototype database, so ignore the pending-changes guard.
            options.ConfigureWarnings(warnings =>
                warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<INoteRepository, NoteRepository>();
        services.AddScoped<IMirrorPreferenceRepository, MirrorPreferenceRepository>();
        services.AddScoped<IPetNameRepository, PetNameRepository>();
        services.AddScoped<IDatabaseInitializer, DatabaseInitializer>();
        return services;
    }
}
