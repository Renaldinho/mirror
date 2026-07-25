namespace Mirror.Server.Data;

/// <summary>
/// A credential allowed to change what the mirror stores. For now there's a single
/// shared account seeded on first run; the table already supports more rows.
/// </summary>
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
}
