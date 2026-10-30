using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

/// <summary>The editable fields of a task, plus files to attach and attached documents to unlink.</summary>
public record UpdateProjectTaskCommand(
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline,
    Guid? PhaseId,
    ProjectTaskStatus Status,
    string? Description,
    IReadOnlyList<TaskAttachment>? Attachments = null,
    IReadOnlyCollection<Guid>? RemoveAttachmentIds = null);

public enum TaskUpdateStatus
{
    Updated,
    NotFound,
    DeadlineBeforeAssigned,
    DeadlineNotLater,
}

/// <summary>The reasons a deadline extension can be logged with (Schedule → View Details).</summary>
public static class DeadlineExtensionReasons
{
    public static readonly IReadOnlyList<string> All =
        ["Weather Delay", "Material Shortage", "Labor Shortage", "Design Change", "Inspection Delay", "Permit Delay", "Other"];
}

public record TaskUpdateResult(TaskUpdateStatus Status, ProjectTaskDto? Task = null);
