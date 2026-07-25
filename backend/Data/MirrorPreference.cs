namespace Mirror.Server.Data;

/// <summary>Singleton row for mirror-wide persisted preferences.</summary>
public class MirrorPreference
{
    public const int SharedId = 1;

    public int Id { get; set; }
    public string ActivePetId { get; set; } = "";
    public DateTimeOffset UpdatedAt { get; set; }
}
