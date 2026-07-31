using Microsoft.EntityFrameworkCore;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<MirrorPreference> MirrorPreferences => Set<MirrorPreference>();
    public DbSet<PetName> PetNames => Set<PetName>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
