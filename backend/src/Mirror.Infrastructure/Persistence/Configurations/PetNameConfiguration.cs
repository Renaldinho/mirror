using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mirror.Domain.Entities;

namespace Mirror.Infrastructure.Persistence.Configurations;

public sealed class PetNameConfiguration : IEntityTypeConfiguration<PetName>
{
    public void Configure(EntityTypeBuilder<PetName> builder)
    {
        builder.HasKey(petName => petName.PetId);
        builder.Property(petName => petName.Name).IsRequired();
    }
}
