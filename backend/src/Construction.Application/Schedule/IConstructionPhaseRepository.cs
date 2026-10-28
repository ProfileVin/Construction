using Construction.Domain.Entities;

namespace Construction.Application.Schedule;

public interface IConstructionPhaseRepository
{
    Task<IReadOnlyList<ConstructionPhase>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(ConstructionPhase phase, CancellationToken cancellationToken);
}
