using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Mirror.Server.Data;

#nullable disable

namespace Mirror.Server.Migrations;

[DbContext(typeof(AppDbContext))]
public sealed class AppDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "10.0.10");

        modelBuilder.Entity<MirrorPreference>(entity =>
        {
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ActivePetId).IsRequired();
            entity.Property(e => e.UpdatedAt);
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<Note>(entity =>
        {
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Text).IsRequired();
            entity.Property(e => e.UpdatedAt);
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<PetName>(entity =>
        {
            entity.Property(e => e.PetId);
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.UpdatedAt);
            entity.HasKey(e => e.PetId);
        });
    }
}
