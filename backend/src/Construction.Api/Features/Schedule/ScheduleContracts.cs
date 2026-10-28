using Construction.Domain.Entities;

namespace Construction.Api.Features.Schedule;

public record CreatePhaseRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int PercentComplete,
    PhaseStatus Status,
    string? CheckpointLabel);

public record PhaseDto(
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
    public static PhaseDto From(Construction.Application.Schedule.ConstructionPhaseDto p) => new(
        p.Id, p.ProjectId, p.Name, p.StartDate, p.EndDate, p.PercentComplete, p.Status, p.CheckpointLabel, p.CreatedAt);
}
