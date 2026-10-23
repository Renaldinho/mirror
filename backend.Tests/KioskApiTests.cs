using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Mirror.Server.Tests;

public sealed class KioskApiTests(MirrorApiFactory factory) : IClassFixture<MirrorApiFactory>
{
    private HttpClient Client() => factory.CreateClient(new WebApplicationFactoryClientOptions
        { BaseAddress = new Uri("http://127.0.0.1") });

    private void Supervisor(string mode = "kiosk")
    {
        File.WriteAllText(Path.Combine(factory.KioskDirectory, "applied-mode"), mode);
        File.WriteAllText(Path.Combine(factory.KioskDirectory, "heartbeat"), "");
        File.SetLastWriteTimeUtc(Path.Combine(factory.KioskDirectory, "heartbeat"), DateTime.UtcNow);
    }

    [Fact]
    public async Task Mode_requests_reach_the_supervisor_without_running_commands()
    {
        using var client = Client();
        Supervisor();
        var status = await client.GetFromJsonAsync<Status>("/api/kiosk");
        Assert.True(status!.Available);
        client.DefaultRequestHeaders.Add("X-Mirror-Request", "kiosk-mode");
        client.DefaultRequestHeaders.Add("Origin", "http://127.0.0.1");
        var response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "desktop" });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal("desktop", await File.ReadAllTextAsync(Path.Combine(factory.KioskDirectory, "requested-mode")));
        Supervisor("desktop");
        status = await client.GetFromJsonAsync<Status>("/api/kiosk");
        Assert.Equal("desktop", status!.Mode);
        response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "kiosk" });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
    }

    [Fact]
    public async Task Missing_supervisor_disables_switching()
    {
        using var client = Client();
        Supervisor();
        File.SetLastWriteTimeUtc(Path.Combine(factory.KioskDirectory, "heartbeat"), DateTime.UtcNow.AddMinutes(-1));
        var status = await client.GetFromJsonAsync<Status>("/api/kiosk");
        Assert.False(status!.Available);
        client.DefaultRequestHeaders.Add("X-Mirror-Request", "kiosk-mode");
        var response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "desktop" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_modes_and_foreign_pages_are_rejected()
    {
        using var client = Client();
        Supervisor();
        var response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "desktop" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        client.DefaultRequestHeaders.Add("X-Mirror-Request", "kiosk-mode");
        response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "shell-command" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        client.DefaultRequestHeaders.Add("Origin", "https://another-site.example");
        response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "desktop" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        client.DefaultRequestHeaders.Remove("Origin");
        client.DefaultRequestHeaders.Host = "another-site.example";
        response = await client.PostAsJsonAsync("/api/kiosk/mode", new { mode = "desktop" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private sealed record Status(bool Available, string Mode);
}
