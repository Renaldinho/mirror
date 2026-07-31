namespace Mirror.Domain.Pets;

/// <summary>
/// The known pet ids. The empty string means "no active pet" (dismissed).
/// </summary>
public static class PetCatalog
{
    public static readonly IReadOnlySet<string> All = new HashSet<string>
    {
        "",
        "capy",
        "lando",
        "frog",
        "shadow-kit",
        "ginger",
        "blue-kit",
        "diplodocus",
        "pigeon",
    };

    public static bool Contains(string petId) => All.Contains(petId);
}
