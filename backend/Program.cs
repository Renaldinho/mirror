using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Mirror.Server.Data;

var builder = WebApplication.CreateBuilder(args);

var configuredPath = builder.Configuration["Database:Path"] ?? "mirror.db";
var databasePath = Path.GetFullPath(configuredPath, builder.Environment.ContentRootPath);
Directory.CreateDirectory(Path.GetDirectoryName(databasePath)!);

var connectionString = new SqliteConnectionStringBuilder
{
    DataSource = databasePath,
    Mode = SqliteOpenMode.ReadWriteCreate,
    Cache = SqliteCacheMode.Shared,
}.ToString();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite(connectionString);
    // The baseline migration intentionally uses CREATE TABLE IF NOT EXISTS so it
    // can adopt the previous EnsureCreated database without dropping its note.
    options.ConfigureWarnings(warnings =>
        warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
});

var app = builder.Build();

await InitialiseDatabaseAsync(app);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/notes", async (AppDbContext db) =>
{
    var note = await db.Notes.FindAsync(Note.SharedId);
    return Results.Ok(new NoteDto(note!.Text, note.UpdatedAt));
});

app.MapPut("/api/notes", async (NoteUpdate body, AppDbContext db) =>
{
    var text = body.Text ?? "";
    if (text.Length > 10_000)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["text"] = ["A note cannot be longer than 10,000 characters."],
        });
    }

    var note = await db.Notes.FindAsync(Note.SharedId);
    note!.Text = text;
    note.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new NoteDto(note.Text, note.UpdatedAt));
});

app.MapGet("/api/pets", async (AppDbContext db) =>
{
    var settings = await db.MirrorPreferences.FindAsync(MirrorPreference.SharedId);
    var names = await db.PetNames
        .AsNoTracking()
        .ToDictionaryAsync(pet => pet.PetId, pet => pet.Name);
    return Results.Ok(new PetsDto(settings!.ActivePetId, names));
});

app.MapPut("/api/pets/active", async (ActivePetUpdate body, AppDbContext db) =>
{
    var petId = body.PetId?.Trim() ?? "";
    if (!PetIds.All.Contains(petId))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["petId"] = ["Choose a known pet or an empty value to dismiss the active pet."],
        });
    }

    var settings = await db.MirrorPreferences.FindAsync(MirrorPreference.SharedId);
    settings!.ActivePetId = petId;
    settings.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new ActivePetDto(settings.ActivePetId, settings.UpdatedAt));
});

app.MapPut("/api/pets/{petId}/name", async (string petId, PetNameUpdate body, AppDbContext db) =>
{
    if (!PetIds.All.Contains(petId))
    {
        return Results.NotFound();
    }

    var name = (body.Name ?? "").Trim();
    if (name.Length > 24)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["name"] = ["A pet name cannot be longer than 24 characters."],
        });
    }

    var petName = await db.PetNames.FindAsync(petId);
    if (petName is null)
    {
        petName = new PetName { PetId = petId };
        db.PetNames.Add(petName);
    }

    petName.Name = name;
    petName.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new PetNameDto(petName.PetId, petName.Name, petName.UpdatedAt));
});

app.Run();

static async Task InitialiseDatabaseAsync(WebApplication app)
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var changed = false;
    if (await db.Notes.FindAsync(Note.SharedId) is null)
    {
        db.Notes.Add(new Note
        {
            Id = Note.SharedId,
            Text = "",
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        changed = true;
    }

    if (await db.MirrorPreferences.FindAsync(MirrorPreference.SharedId) is null)
    {
        db.MirrorPreferences.Add(new MirrorPreference
        {
            Id = MirrorPreference.SharedId,
            ActivePetId = "",
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        changed = true;
    }

    if (changed)
    {
        await db.SaveChangesAsync();
    }
}

public partial class Program;

record NoteDto(string Text, DateTimeOffset UpdatedAt);
record NoteUpdate(string? Text);
record PetsDto(string ActivePetId, IReadOnlyDictionary<string, string> Names);
record ActivePetUpdate(string? PetId);
record ActivePetDto(string PetId, DateTimeOffset UpdatedAt);
record PetNameUpdate(string? Name);
record PetNameDto(string PetId, string Name, DateTimeOffset UpdatedAt);

static class PetIds
{
    public static readonly HashSet<string> All =
    [
        "",
        "capy",
        "lando",
        "frog",
        "shadow-kit",
        "ginger",
        "blue-kit",
        "diplodocus",
        "pigeon",
    ];
}
