namespace Construction.Application.Schedule;

public interface IScheduleService
{
    Task<IReadOnlyList<ConstructionPhaseDto>?> ListPhasesAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<ConstructionPhaseDto?> CreatePhaseAsync(
        string ownerId, Guid projectId, CreateConstructionPhaseCommand command, CancellationToken cancellationToken);
}
