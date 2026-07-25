using Microsoft.EntityFrameworkCore;

namespace Mirror.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<MirrorPreference> MirrorPreferences => Set<MirrorPreference>();
    public DbSet<PetName> PetNames => Set<PetName>();
}
