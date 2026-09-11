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

    public Task AddAsync(ProjectTask task, CancellationToken cancellationToken)
    {
        db.ProjectTasks.Add(task);
        return Task.CompletedTask;
    }
}
