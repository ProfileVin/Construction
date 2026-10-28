namespace Construction.Application.Dashboard;

public interface IDashboardService
{
    Task<IReadOnlyList<ProjectTaskDto>?> ListTasksAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<ProjectTaskDto?> CreateTaskAsync(
        string ownerId,
        Guid projectId,
        CreateProjectTaskCommand command,
        CancellationToken cancellationToken,
        DateTime? occurredAtUtc = null);

    /// <summary>Adds a numbered activity-log row when the status changes.</summary>
    Task<TaskUpdateResult> UpdateTaskAsync(
        string ownerId, Guid projectId, Guid taskId, UpdateProjectTaskCommand command, CancellationToken cancellationToken);

    /// <summary>Moves the deadline later and logs the reason on the task.</summary>
    Task<TaskUpdateResult> ExtendTaskDeadlineAsync(
        string ownerId, Guid projectId, Guid taskId, DateOnly newDeadline, string reason, CancellationToken cancellationToken);

    Task<IReadOnlyList<ActivityLogEntryDto>?> ListActivityLogAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    /// <summary>Null when the project isn't the owner's or the task isn't in it.</summary>
    Task<IReadOnlyList<ActivityLogEntryDto>?> ListTaskActivityLogAsync(
        string ownerId, Guid projectId, Guid taskId, CancellationToken cancellationToken);

    /// <summary>A manual log on one of the project's tasks. Null when the project isn't the owner's or the task isn't in it.</summary>
    Task<ActivityLogEntryDto?> CreateActivityLogAsync(
        string ownerId, Guid projectId, CreateActivityLogCommand command, CancellationToken cancellationToken);

    /// <summary>Null when the project isn't the owner's or the entry doesn't belong to it.</summary>
    Task<ActivityLogEntryDto?> UpdateActivityLogDescriptionAsync(
        string ownerId, Guid projectId, Guid entryId, string description, CancellationToken cancellationToken);
}
