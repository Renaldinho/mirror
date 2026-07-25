using Microsoft.EntityFrameworkCore;

namespace Mirror.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<User> Users => Set<User>();
}
