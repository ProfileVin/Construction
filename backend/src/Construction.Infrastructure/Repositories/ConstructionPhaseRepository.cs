using Construction.Application.Schedule;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class ConstructionPhaseRepository(AppDbContext db) : IConstructionPhaseRepository
{
    public async Task<IReadOnlyList<ConstructionPhase>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.ConstructionPhases
            .Where(p => p.ProjectId == projectId)
            .OrderBy(p => p.StartDate).ThenBy(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(ConstructionPhase phase, CancellationToken cancellationToken)
    {
        db.ConstructionPhases.Add(phase);
        return Task.CompletedTask;
    }
}
