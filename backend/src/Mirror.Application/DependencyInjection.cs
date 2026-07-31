using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Mirror.Application.Notes;
using Mirror.Application.Pets;

namespace Mirror.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<UpdateNoteRequestValidator>();
        services.AddScoped<INoteService, NoteService>();
        services.AddScoped<IPetService, PetService>();
        return services;
    }
}
