using Construction.Application.Projects;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class ProjectRepository(AppDbContext db) : IProjectRepository
{
    public async Task<IReadOnlyList<Project>> ListByOwnerAsync(string ownerId, CancellationToken cancellationToken)
    {
        return await db.Projects
            .Where(p => p.OwnerId == ownerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsForOwnerAsync(Guid projectId, string ownerId, CancellationToken cancellationToken)
    {
        return await db.Projects.AnyAsync(p => p.Id == projectId && p.OwnerId == ownerId, cancellationToken);
    }

    public Task AddAsync(Project project, CancellationToken cancellationToken)
    {
        db.Projects.Add(project);
        return Task.CompletedTask;
    }
}
