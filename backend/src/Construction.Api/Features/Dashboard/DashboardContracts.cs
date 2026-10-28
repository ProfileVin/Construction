using Construction.Domain.Entities;

namespace Construction.Api.Features.Dashboard;

/// <summary>
/// Sent as multipart/form-data so an optional attachment can ride along. Strings are nullable so MVC's
/// implicit [Required] doesn't pre-empt CreateProjectTaskRequestValidator's messages.
/// </summary>
public class CreateProjectTaskRequest
{
    public string? Title { get; set; }

    public string? AssigneeName { get; set; }

    public DateOnly AssignedDate { get; set; }

    public DateOnly Deadline { get; set; }

    public Guid? PhaseId { get; set; }

    public ProjectTaskStatus Status { get; set; } = ProjectTaskStatus.Upcoming;

    public IFormFile? Attachment { get; set; }
}

/// <summary>JSON body for editing a task. Strings are nullable for the same reason as the create request.</summary>
public record UpdateProjectTaskRequest(
    string? Title,
    string? AssigneeName,
    DateOnly Deadline,
    Guid? PhaseId,
    ProjectTaskStatus Status);

public record ProjectTaskDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline,
    Guid? PhaseId,
    string? PhaseName,
    ProjectTaskStatus Status,
    Guid? AttachmentDocumentId,
    DateTime CreatedAt)
{
    public static ProjectTaskDto From(Construction.Application.Dashboard.ProjectTaskDto t) => new(
        t.Id, t.ProjectId, t.Title, t.AssigneeName, t.AssignedDate, t.Deadline,
        t.PhaseId, t.PhaseName, t.Status, t.AttachmentDocumentId, t.CreatedAt);
}

public record ActivityLogEntryDto(
    Guid Id,
    Guid ProjectId,
    Guid? ProjectTaskId,
    string LogNumber,
    string Description,
    DateTime OccurredAt,
    string? TaskTitle,
    string? AssigneeName,
    string? PhaseName,
    int? PhaseNumber,
    string? Category,
    Guid? AttachmentDocumentId)
{
    public static ActivityLogEntryDto From(Construction.Application.Dashboard.ActivityLogEntryDto e) => new(
        e.Id, e.ProjectId, e.ProjectTaskId, e.LogNumber, e.Description, e.OccurredAt,
        e.TaskTitle, e.AssigneeName, e.PhaseName, e.PhaseNumber, e.Category, e.AttachmentDocumentId);
}

/// <summary>"New Log" (Task Log page), multipart for the optional attachment. Nullable for the same reason as the task request.</summary>
public class CreateActivityLogRequest
{
    public Guid? TaskId { get; set; }

    public string? Category { get; set; }

    public string? AssigneeName { get; set; }

    public string? Note { get; set; }

    public IFormFile? Attachment { get; set; }
}

public record UpdateActivityLogRequest(string? Description);

/// <summary>Schedule → View Details "Extend Deadline". Nullable so the validator owns the messages.</summary>
public record ExtendTaskDeadlineRequest(DateOnly? Deadline, string? Reason);
