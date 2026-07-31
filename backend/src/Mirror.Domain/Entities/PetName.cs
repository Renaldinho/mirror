namespace Mirror.Domain.Entities;

/// <summary>A user-supplied display name for one catalog pet (keyed by pet id).</summary>
public class PetName
{
    public string PetId { get; set; } = "";
    public string Name { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; }
}
