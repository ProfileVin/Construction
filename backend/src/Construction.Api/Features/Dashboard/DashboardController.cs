using Construction.Api.Common;
using Construction.Application.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Dashboard;

[ApiController]
[Route("api/projects/{projectId:guid}")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("tasks")]
    public async Task<IResult> ListTasksAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var tasks = await dashboardService.ListTasksAsync(userId, projectId, cancellationToken);
        return tasks is null ? Results.NotFound() : Results.Ok(tasks.Select(ProjectTaskDto.From));
    }

    [HttpPost("tasks")]
    public async Task<IResult> CreateTaskAsync(
        Guid projectId, [FromBody] CreateProjectTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var command = new CreateProjectTaskCommand(
            request.Title, request.AssigneeName, request.AssignedDate, request.Deadline, request.PhaseId, request.Status);
        var task = await dashboardService.CreateTaskAsync(userId, projectId, command, cancellationToken);

        return task is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/tasks/{task.Id}", ProjectTaskDto.From(task));
    }

    [HttpGet("activity-log")]
    public async Task<IResult> ListActivityLogAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var entries = await dashboardService.ListActivityLogAsync(userId, projectId, cancellationToken);
        return entries is null ? Results.NotFound() : Results.Ok(entries.Select(ActivityLogEntryDto.From));
    }
}
