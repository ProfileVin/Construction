using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public interface IActivityLogRepository
{
    Task<IReadOnlyList<ActivityLogEntry>> ListRecentByProjectAsync(Guid projectId, int take, CancellationToken cancellationToken);

    Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    /// <summary>Tracked entity (for updates), or null if it isn't in this project.</summary>
    Task<ActivityLogEntry?> GetAsync(Guid projectId, Guid entryId, CancellationToken cancellationToken);

    Task AddAsync(ActivityLogEntry entry, CancellationToken cancellationToken);
}
