using Mirror.Application;
using Mirror.Infrastructure;
using Mirror.Infrastructure.Persistence;
using Mirror.Server.ExceptionHandlers;

var builder = WebApplication.CreateBuilder(args);

var configuredPath = builder.Configuration["Database:Path"] ?? "mirror.db";
var databasePath = Path.GetFullPath(configuredPath, builder.Environment.ContentRootPath);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ValidationExceptionHandler>();
builder.Services.AddExceptionHandler<NotFoundExceptionHandler>();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(databasePath);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
    await initializer.InitialiseAsync();
}

app.UseExceptionHandler();
app.MapControllers();

app.Run();

public partial class Program;
