using Construction.Application.Dashboard;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class ProjectTaskRepository(AppDbContext db) : IProjectTaskRepository
{
    public async Task<IReadOnlyList<ProjectTask>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.ProjectTasks
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<ProjectTask> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, TaskListQuery query, CancellationToken cancellationToken)
    {
        var q = db.ProjectTasks.Where(t => t.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(t => EF.Functions.Like(t.Title, $"%{term}%") || EF.Functions.Like(t.AssigneeName, $"%{term}%"));
        }

        if (query.PhaseId is { } phaseId)
        {
            q = q.Where(t => t.PhaseId == phaseId);
        }

        if (query.Status is { } status)
        {
            q = q.Where(t => t.Status == status);
        }

        if (query.FromDate is { } fromDate)
        {
            q = q.Where(t => t.Deadline >= fromDate);
        }

        if (query.ToDate is { } toDate)
        {
            q = q.Where(t => t.Deadline <= toDate);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderBy(t => t.Deadline).ThenBy(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyDictionary<string, int>> CountOpenByAssigneeAsync(
        Guid projectId, CancellationToken cancellationToken)
    {
        var rows = await db.ProjectTasks
            .Where(t => t.ProjectId == projectId && t.Status != ProjectTaskStatus.Completed)
            .GroupBy(t => t.AssigneeName)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Fold in memory too, so the lookup is case-insensitive regardless of DB collation.
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var row in rows)
        {
            counts[row.Name] = counts.GetValueOrDefault(row.Name) + row.Count;
        }

        return counts;
    }

    public Task AddAsync(ProjectTask task, CancellationToken cancellationToken)
    {
        db.ProjectTasks.Add(task);
        return Task.CompletedTask;
    }
}
