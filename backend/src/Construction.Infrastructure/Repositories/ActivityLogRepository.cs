using Construction.Application.Dashboard;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class ActivityLogRepository(AppDbContext db) : IActivityLogRepository
{
    public async Task<IReadOnlyList<ActivityLogEntry>> ListRecentByProjectAsync(
        Guid projectId, int take, CancellationToken cancellationToken)
    {
        return await db.ActivityLogEntries
            .Where(e => e.ProjectId == projectId)
            .OrderByDescending(e => e.OccurredAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken) =>
        db.ActivityLogEntries.CountAsync(e => e.ProjectId == projectId, cancellationToken);

    public Task<ActivityLogEntry?> GetAsync(Guid projectId, Guid entryId, CancellationToken cancellationToken) =>
        db.ActivityLogEntries.FirstOrDefaultAsync(e => e.ProjectId == projectId && e.Id == entryId, cancellationToken);

    public Task AddAsync(ActivityLogEntry entry, CancellationToken cancellationToken)
    {
        db.ActivityLogEntries.Add(entry);
        return Task.CompletedTask;
    }
}
