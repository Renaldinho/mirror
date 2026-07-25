using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Xunit;

namespace Mirror.Server.Tests;

public sealed class MirrorApiTests : IClassFixture<MirrorApiFactory>
{
    private readonly HttpClient client;

    public MirrorApiTests(MirrorApiFactory factory)
    {
        client = factory.CreateClient();
    }

    [Fact]
    public async Task Note_round_trips_through_sqlite()
    {
        var update = await client.PutAsJsonAsync("/api/notes", new { text = "Buy oat milk" });
        update.EnsureSuccessStatusCode();

        var note = await client.GetFromJsonAsync<NoteResponse>("/api/notes");

        Assert.Equal("Buy oat milk", note!.Text);
        Assert.NotEqual(default, note.UpdatedAt);
    }

    [Fact]
    public async Task Oversized_note_is_rejected()
    {
        var response = await client.PutAsJsonAsync("/api/notes", new { text = new string('x', 10_001) });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Active_pet_and_names_round_trip()
    {
        (await client.PutAsJsonAsync("/api/pets/active", new { petId = "capy" }))
            .EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync("/api/pets/capy/name", new { name = "Biscuit" }))
            .EnsureSuccessStatusCode();

        var pets = await client.GetFromJsonAsync<PetsResponse>("/api/pets");

        Assert.Equal("capy", pets!.ActivePetId);
        Assert.Equal("Biscuit", pets.Names["capy"]);
    }

    [Fact]
    public async Task Unknown_pet_is_rejected()
    {
        var select = await client.PutAsJsonAsync("/api/pets/active", new { petId = "dragon" });
        var rename = await client.PutAsJsonAsync("/api/pets/dragon/name", new { name = "Smaug" });

        Assert.Equal(HttpStatusCode.BadRequest, select.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, rename.StatusCode);
    }

    [Fact]
    public async Task Legacy_database_keeps_its_note_and_drops_the_old_login()
    {
        await using var factory = new LegacyMirrorApiFactory();
        using var legacyClient = factory.CreateClient();

        var note = await legacyClient.GetFromJsonAsync<NoteResponse>("/api/notes");

        Assert.Equal("Legacy note", note!.Text);
        await using var connection = new SqliteConnection($"Data Source={factory.DatabasePath}");
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'Users'";
        Assert.Equal(0L, (long)(await command.ExecuteScalarAsync())!);
    }

    private sealed record NoteResponse(string Text, DateTimeOffset UpdatedAt);
    private sealed record PetsResponse(string ActivePetId, Dictionary<string, string> Names);
}

public sealed class LegacyMirrorApiFactory : WebApplicationFactory<Program>, IAsyncDisposable
{
    private readonly string directory = Path.Combine(
        Path.GetTempPath(),
        "mirror-tests",
        Guid.NewGuid().ToString("N"));

    public string DatabasePath => Path.Combine(directory, "mirror.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(directory);
        using var connection = new SqliteConnection($"Data Source={DatabasePath}");
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText =
            """
            CREATE TABLE "Notes" (
                "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "Text" TEXT NOT NULL,
                "UpdatedAt" TEXT NOT NULL
            );
            CREATE TABLE "Users" (
                "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "Username" TEXT NOT NULL,
                "PasswordHash" TEXT NOT NULL
            );
            INSERT INTO "Notes" ("Id", "Text", "UpdatedAt")
                VALUES (1, 'Legacy note', '2026-07-25T00:00:00+00:00');
            INSERT INTO "Users" ("Username", "PasswordHash")
                VALUES ('mirror', 'obsolete');
            """;
        command.ExecuteNonQuery();
        builder.UseSetting("Database:Path", DatabasePath);
    }

    public new async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        SqliteConnection.ClearAllPools();
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, recursive: true);
        }
        GC.SuppressFinalize(this);
    }
}

public sealed class MirrorApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string directory = Path.Combine(
        Path.GetTempPath(),
        "mirror-tests",
        Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(directory);
        builder.UseSetting("Database:Path", Path.Combine(directory, "mirror.db"));
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        SqliteConnection.ClearAllPools();
        if (Directory.Exists(directory))
        {
            Directory.Delete(directory, recursive: true);
        }
    }
}
