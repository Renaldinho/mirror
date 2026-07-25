using System.ComponentModel.DataAnnotations;

namespace Mirror.Server.Data;

/// <summary>A user-supplied display name for one catalog pet.</summary>
public class PetName
{
    [Key]
    public string PetId { get; set; } = "";
    public string Name { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; }
}
