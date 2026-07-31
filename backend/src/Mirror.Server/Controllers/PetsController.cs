using Microsoft.AspNetCore.Mvc;
using Mirror.Application.Pets;

namespace Mirror.Server.Controllers;

[ApiController]
[Route("api/pets")]
public sealed class PetsController(IPetService pets) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PetsDto>> Get(CancellationToken cancellationToken)
        => Ok(await pets.GetAsync(cancellationToken));

    [HttpPut("active")]
    public async Task<ActionResult<ActivePetDto>> SetActive(
        [FromBody] SetActivePetRequest request,
        CancellationToken cancellationToken)
        => Ok(await pets.SetActiveAsync(request, cancellationToken));

    [HttpPut("{petId}/name")]
    public async Task<ActionResult<PetNameDto>> SetName(
        string petId,
        [FromBody] SetPetNameRequest request,
        CancellationToken cancellationToken)
        => Ok(await pets.SetNameAsync(petId, request, cancellationToken));
}
