namespace Mirror.Domain.Entities;

/// <summary>The single shared scratchpad note (one row, <see cref="SharedId"/>).</summary>
public class Note
{
    public const int SharedId = 1;

    public int Id { get; set; }
    public string Text { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; }
}
