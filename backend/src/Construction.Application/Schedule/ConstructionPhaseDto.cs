using Construction.Domain.Entities;

namespace Construction.Application.Schedule;

public record ConstructionPhaseDto(
    Guid Id,
    Guid ProjectId,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int PercentComplete,
    PhaseStatus Status,
    string? CheckpointLabel,
    DateTime CreatedAt)
{
    public static ConstructionPhaseDto From(ConstructionPhase p) => new(
        p.Id, p.ProjectId, p.Name, p.StartDate, p.EndDate, p.PercentComplete, p.Status, p.CheckpointLabel, p.CreatedAt);
}
