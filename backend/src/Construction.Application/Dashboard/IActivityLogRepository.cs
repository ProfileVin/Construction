using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public interface IActivityLogRepository
{
    Task<IReadOnlyList<ActivityLogEntry>> ListRecentByProjectAsync(Guid projectId, int take, CancellationToken cancellationToken);

    /// <summary>Every entry on one task, newest first.</summary>
    Task<IReadOnlyList<ActivityLogEntry>> ListByTaskAsync(Guid projectId, Guid taskId, CancellationToken cancellationToken);

    Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    /// <summary>Tracked entity (for updates), or null if it isn't in this project.</summary>
    Task<ActivityLogEntry?> GetAsync(Guid projectId, Guid entryId, CancellationToken cancellationToken);

    Task AddAsync(ActivityLogEntry entry, CancellationToken cancellationToken);

    /// <summary>Queues removal of every entry on the task (its FK is Restrict, so this precedes deleting the task).</summary>
    Task RemoveByTaskAsync(Guid projectId, Guid taskId, CancellationToken cancellationToken);
}
