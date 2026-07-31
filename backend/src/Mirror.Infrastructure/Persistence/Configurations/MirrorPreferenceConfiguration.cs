using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence.Configurations;

public sealed class MirrorPreferenceConfiguration : IEntityTypeConfiguration<MirrorPreference>
{
    public void Configure(EntityTypeBuilder<MirrorPreference> builder)
    {
        builder.HasKey(preference => preference.Id);
        builder.Property(preference => preference.Id).ValueGeneratedOnAdd();
        builder.Property(preference => preference.ActivePetId).IsRequired();
    }
}
