using Construction.Api.Common;
using Construction.Application.Dashboard;
using Construction.Application.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Dashboard;

[ApiController]
[Route("api/projects/{projectId:guid}")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    // Multipart framing adds a little on top of the attachment itself.
    private const long MaxRequestBytes = DocumentUploadRules.TaskAttachmentMaxSizeBytes + (1024 * 1024);

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
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IResult> CreateTaskAsync(
        Guid projectId, [FromForm] CreateProjectTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Size/extension are already checked by CreateProjectTaskRequestValidator (run by FluentValidationFilter).
        await using var content = request.Attachment?.OpenReadStream();
        var attachment = request.Attachment is { } file
            ? new TaskAttachment(file.FileName, file.ContentType, file.Length, content!)
            : null;

        // Non-empty Title/AssigneeName are guaranteed by the validator.
        var command = new CreateProjectTaskCommand(
            request.Title!, request.AssigneeName!, request.AssignedDate, request.Deadline, request.PhaseId, request.Status,
            attachment);
        var task = await dashboardService.CreateTaskAsync(userId, projectId, command, cancellationToken);

        return task is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/tasks/{task.Id}", ProjectTaskDto.From(task));
    }

    [HttpPut("tasks/{taskId:guid}")]
    public async Task<IResult> UpdateTaskAsync(
        Guid projectId, Guid taskId, [FromBody] UpdateProjectTaskRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Non-empty Title/AssigneeName are guaranteed by UpdateProjectTaskRequestValidator.
        var command = new UpdateProjectTaskCommand(
            request.Title!, request.AssigneeName!, request.Deadline, request.PhaseId, request.Status);
        var result = await dashboardService.UpdateTaskAsync(userId, projectId, taskId, command, cancellationToken);

        return result.Status switch
        {
            TaskUpdateStatus.Updated => Results.Ok(ProjectTaskDto.From(result.Task!)),
            TaskUpdateStatus.DeadlineBeforeAssigned => Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["deadline"] = ["Deadline must be on or after the assigned date."],
            }),
            _ => Results.NotFound(),
        };
    }

    [HttpPost("tasks/{taskId:guid}/extend-deadline")]
    public async Task<IResult> ExtendTaskDeadlineAsync(
        Guid projectId, Guid taskId, [FromBody] ExtendTaskDeadlineRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Deadline and a known Reason are guaranteed by ExtendTaskDeadlineRequestValidator.
        var result = await dashboardService.ExtendTaskDeadlineAsync(
            userId, projectId, taskId, request.Deadline!.Value, request.Reason!, cancellationToken);

        return result.Status switch
        {
            TaskUpdateStatus.Updated => Results.Ok(ProjectTaskDto.From(result.Task!)),
            TaskUpdateStatus.DeadlineNotLater => Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["deadline"] = ["New deadline must be after the current one."],
            }),
            _ => Results.NotFound(),
        };
    }

    [HttpGet("tasks/{taskId:guid}/activity-log")]
    public async Task<IResult> ListTaskActivityLogAsync(Guid projectId, Guid taskId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var entries = await dashboardService.ListTaskActivityLogAsync(userId, projectId, taskId, cancellationToken);
        return entries is null ? Results.NotFound() : Results.Ok(entries.Select(ActivityLogEntryDto.From));
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

    [HttpPost("activity-log")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IResult> CreateActivityLogAsync(
        Guid projectId, [FromForm] CreateActivityLogRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Required fields, the category list and the attachment rules are checked by CreateActivityLogRequestValidator.
        await using var content = request.Attachment?.OpenReadStream();
        var attachment = request.Attachment is { } file
            ? new TaskAttachment(file.FileName, file.ContentType, file.Length, content!)
            : null;

        var command = new CreateActivityLogCommand(
            request.TaskId!.Value, request.Category!, request.AssigneeName!, request.Note!, attachment);
        var entry = await dashboardService.CreateActivityLogAsync(userId, projectId, command, cancellationToken);

        return entry is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/activity-log/{entry.Id}", ActivityLogEntryDto.From(entry));
    }

    [HttpPut("activity-log/{entryId:guid}")]
    public async Task<IResult> UpdateActivityLogAsync(
        Guid projectId, Guid entryId, [FromBody] UpdateActivityLogRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Non-empty Description is guaranteed by UpdateActivityLogRequestValidator.
        var entry = await dashboardService.UpdateActivityLogDescriptionAsync(
            userId, projectId, entryId, request.Description!, cancellationToken);
        return entry is null ? Results.NotFound() : Results.Ok(ActivityLogEntryDto.From(entry));
    }
}
