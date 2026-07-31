using Microsoft.AspNetCore.Mvc;
using Mirror.Application.Notes;

namespace Mirror.Server.Controllers;

[ApiController]
[Route("api/notes")]
public sealed class NotesController(INoteService notes) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<NoteDto>> Get(CancellationToken cancellationToken)
        => Ok(await notes.GetAsync(cancellationToken));

    [HttpPut]
    public async Task<ActionResult<NoteDto>> Update(
        [FromBody] UpdateNoteRequest request,
        CancellationToken cancellationToken)
        => Ok(await notes.UpdateAsync(request, cancellationToken));
}
