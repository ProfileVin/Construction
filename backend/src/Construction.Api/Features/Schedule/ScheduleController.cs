using Construction.Api.Common;
using Construction.Application.Schedule;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Schedule;

[ApiController]
[Route("api/projects/{projectId:guid}")]
[Authorize]
public class ScheduleController(IScheduleService scheduleService) : ControllerBase
{
    [HttpGet("phases")]
    public async Task<IResult> ListPhasesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var phases = await scheduleService.ListPhasesAsync(userId, projectId, cancellationToken);
        return phases is null ? Results.NotFound() : Results.Ok(phases.Select(PhaseDto.From));
    }

    [HttpPost("phases")]
    public async Task<IResult> CreatePhaseAsync(
        Guid projectId, [FromBody] CreatePhaseRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var command = new CreateConstructionPhaseCommand(
            request.Name, request.StartDate, request.EndDate, request.PercentComplete, request.Status, request.CheckpointLabel);
        var phase = await scheduleService.CreatePhaseAsync(userId, projectId, command, cancellationToken);

        return phase is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/phases/{phase.Id}", PhaseDto.From(phase));
    }
}
