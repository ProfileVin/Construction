using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public interface IActivityLogRepository
{
    Task<IReadOnlyList<ActivityLogEntry>> ListRecentByProjectAsync(Guid projectId, int take, CancellationToken cancellationToken);

    Task AddAsync(ActivityLogEntry entry, CancellationToken cancellationToken);
}
