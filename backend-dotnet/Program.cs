using System.Net.WebSockets;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Mirror.Server.Auth;
using Mirror.Server.Data;
using Mirror.Server.Realtime;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=mirror.db"));
builder.Services.AddSingleton<NoteBroadcaster>();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "mirror.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.SlidingExpiration = true;
        // This is an API, not an MVC app: answer with 401/403 instead of redirecting.
        options.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
        options.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
    });
builder.Services.AddAuthorization();

const string CorsPolicy = "dashboard";
builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy => policy
    .WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
    .AllowCredentials()
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

// Create the SQLite file on first run: the shared note plus the shared login.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    if (await db.Notes.FindAsync(Note.SharedId) is null)
    {
        db.Notes.Add(new Note { Id = Note.SharedId, Text = "", UpdatedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
    }

    if (!await db.Users.AnyAsync())
    {
        var username = builder.Configuration["Auth:Username"] ?? "mirror";
        var password = builder.Configuration["Auth:Password"] ?? "changeme";
        if (password == "changeme")
        {
            app.Logger.LogWarning("Seeding the shared login with the default password. Set Auth__Username / Auth__Password to override.");
        }
        db.Users.Add(new User { Username = username, PasswordHash = PasswordHasher.Hash(password) });
        await db.SaveChangesAsync();
    }
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.UseWebSockets();

var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);

// --- auth ---
app.MapPost("/api/auth/login", async (LoginDto body, AppDbContext db, HttpContext http) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == body.Username);
    if (user is null || !PasswordHasher.Verify(body.Password ?? "", user.PasswordHash))
        return Results.Unauthorized();

    var identity = new ClaimsIdentity(
        [new Claim(ClaimTypes.Name, user.Username)],
        CookieAuthenticationDefaults.AuthenticationScheme);
    await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
    return Results.Ok(new { username = user.Username });
});

app.MapPost("/api/auth/logout", async (HttpContext http) =>
{
    await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok();
});

app.MapGet("/api/auth/me", (HttpContext http) =>
    http.User.Identity?.IsAuthenticated == true
        ? Results.Ok(new { username = http.User.Identity.Name })
        : Results.Unauthorized());

// --- notes ---
app.MapGet("/api/notes", async (AppDbContext db) =>
{
    var note = await db.Notes.FindAsync(Note.SharedId);
    return Results.Ok(new NoteDto(note!.Text, note.UpdatedAt));
});

app.MapPut("/api/notes", async (NoteUpdate body, AppDbContext db, NoteBroadcaster hub) =>
{
    var note = await db.Notes.FindAsync(Note.SharedId);
    note!.Text = body.Text ?? "";
    note.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    var payload = JsonSerializer.Serialize(new NoteEvent("note.updated", note.Text, note.UpdatedAt), json);
    await hub.BroadcastAsync(payload);
    return Results.Ok(new NoteDto(note.Text, note.UpdatedAt));
}).RequireAuthorization();

// Receive-only realtime: greet the client with the current note, then hold the
// socket open (draining frames) so we can push future updates to it.
app.Map("/ws", async (HttpContext ctx, AppDbContext db, NoteBroadcaster hub) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest)
    {
        ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    using var socket = await ctx.WebSockets.AcceptWebSocketAsync();
    var id = hub.Add(socket);

    var note = await db.Notes.FindAsync(Note.SharedId);
    var hello = JsonSerializer.Serialize(new NoteEvent("note.updated", note!.Text, note.UpdatedAt), json);
    await socket.SendAsync(Encoding.UTF8.GetBytes(hello), WebSocketMessageType.Text, endOfMessage: true, CancellationToken.None);

    var buffer = new byte[4096];
    try
    {
        while (socket.State == WebSocketState.Open)
        {
            var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
            if (result.MessageType == WebSocketMessageType.Close) break;
        }
    }
    catch (WebSocketException)
    {
        // client dropped without a clean close; fall through to cleanup
    }
    finally
    {
        hub.Remove(id);
    }
});

// SPA fallback: any non-API path serves the Angular app (when built into wwwroot).
app.MapFallbackToFile("index.html");

app.Run();

record LoginDto(string Username, string Password);
record NoteDto(string Text, DateTimeOffset UpdatedAt);
record NoteUpdate(string Text);
record NoteEvent(string Type, string Text, DateTimeOffset UpdatedAt);
