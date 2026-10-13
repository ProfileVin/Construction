using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

/// <summary>The editable fields of a task — the assigned date and attachment stay as created.</summary>
public record UpdateProjectTaskCommand(
    string Title,
    string AssigneeName,
    DateOnly Deadline,
    Guid? PhaseId,
    ProjectTaskStatus Status);

public enum TaskUpdateStatus
{
    Updated,
    NotFound,
    DeadlineBeforeAssigned,
}

public record TaskUpdateResult(TaskUpdateStatus Status, ProjectTaskDto? Task = null);
