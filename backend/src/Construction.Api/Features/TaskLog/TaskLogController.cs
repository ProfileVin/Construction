using Construction.Api.Common;
using Construction.Application.Dashboard;
using Construction.Application.TaskLog;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ApiProjectTaskDto = Construction.Api.Features.Dashboard.ProjectTaskDto;

namespace Construction.Api.Features.TaskLog;

[ApiController]
[Route("api/projects/{projectId:guid}")]
[Authorize]
public class TaskLogController(ITaskLogService taskLogService) : ControllerBase
{
    [HttpGet("task-log")]
    public async Task<IResult> SearchAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] Guid? phaseId,
        [FromQuery] ProjectTaskStatus? status,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new TaskListQuery(
            search, phaseId, status, fromDate, toDate,
            page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);

        var result = await taskLogService.SearchTasksAsync(userId, projectId, query, cancellationToken);
        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<ApiProjectTaskDto>(
            result.Items.Select(ApiProjectTaskDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }
}
