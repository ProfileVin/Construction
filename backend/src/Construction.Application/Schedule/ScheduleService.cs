using Construction.Application.Common;
using Construction.Application.Projects;
using Construction.Domain.Entities;

namespace Construction.Application.Schedule;

public class ScheduleService(
    IProjectRepository projects,
    IConstructionPhaseRepository phases,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IScheduleService
{
    public async Task<IReadOnlyList<ConstructionPhaseDto>?> ListPhasesAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var items = await phases.ListByProjectAsync(projectId, cancellationToken);
        return items.Select(ConstructionPhaseDto.From).ToList();
    }

    public async Task<ConstructionPhaseDto?> CreatePhaseAsync(
        string ownerId, Guid projectId, CreateConstructionPhaseCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var phase = ConstructionPhase.Create(
            projectId, command.Name, command.StartDate, command.EndDate,
            command.PercentComplete, command.Status, command.CheckpointLabel, nowUtc);

        await phases.AddAsync(phase, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ConstructionPhaseDto.From(phase);
    }
}
