namespace Mirror.Server.Data;

/// <summary>
/// A note on the board. For now the widget is a single shared scratchpad, so we
/// keep one row (<see cref="SharedId"/>); the table shape already allows many
/// rows if we grow to individual post-its later.
/// </summary>
public class Note
{
    public const int SharedId = 1;

    public int Id { get; set; }
    public string Text { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; }
}
