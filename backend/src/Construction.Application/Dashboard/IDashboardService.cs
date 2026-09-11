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

    Task<IReadOnlyList<ActivityLogEntryDto>?> ListActivityLogAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);
}
