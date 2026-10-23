using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Mirror.Server.Controllers;

/// <summary>Request a fixed browser mode from the desktop user's kiosk supervisor.</summary>
[ApiController]
[Route("api/kiosk")]
public sealed class KioskController(IConfiguration configuration) : ControllerBase
{
    private readonly string? directory = configuration["Kiosk:ControlDirectory"];

    [HttpGet]
    public ActionResult<KioskStatus> Get() => Ok(ReadStatus());

    [HttpPost("mode")]
    public async Task<ActionResult<KioskStatus>> SetMode(ModeRequest request, CancellationToken cancellationToken)
    {
        // Only the local mirror UI can request a mode. No executable/arguments are accepted.
        var origin = Request.Headers.Origin.ToString();
        if (Request.Headers["X-Mirror-Request"] != "kiosk-mode"
            || !IsLocalHost(Request.Host.Host)
            || (origin.Length > 0 && (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                || uri.Scheme != "http" || !IsLocalHost(uri.Host) || uri.Port is not (80 or 4200))))
            return StatusCode(StatusCodes.Status403Forbidden);

        var status = ReadStatus();
        if (!status.Available)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Restart the updated Pi kiosk to enable desktop switching." });

        var temporary = Path.Combine(directory!, $"mode.{Guid.NewGuid():N}.tmp");
        try
        {
            await System.IO.File.WriteAllTextAsync(temporary, request.Mode, cancellationToken);
            System.IO.File.Move(temporary, Path.Combine(directory!, "requested-mode"), overwrite: true);
        }
        finally
        {
            if (System.IO.File.Exists(temporary)) System.IO.File.Delete(temporary);
        }
        return Accepted(new KioskStatus(true, request.Mode));
    }

    private KioskStatus ReadStatus()
    {
        if (string.IsNullOrWhiteSpace(directory)) return new(false, "kiosk");
        try
        {
            var heartbeat = Path.Combine(directory, "heartbeat");
            if (!System.IO.File.Exists(heartbeat)
                || DateTime.UtcNow - System.IO.File.GetLastWriteTimeUtc(heartbeat) > TimeSpan.FromSeconds(5))
                return new(false, "kiosk");
            var mode = System.IO.File.ReadAllText(Path.Combine(directory, "applied-mode")).Trim();
            return mode is "kiosk" or "desktop" ? new(true, mode) : new(false, "kiosk");
        }
        catch (IOException) { return new(false, "kiosk"); }
        catch (UnauthorizedAccessException) { return new(false, "kiosk"); }
    }

    private static bool IsLocalHost(string host) => host is "127.0.0.1" or "localhost" or "::1";

    public sealed record ModeRequest(
        [Required, AllowedValues("kiosk", "desktop")] string Mode);
    public sealed record KioskStatus(bool Available, string Mode);
}
