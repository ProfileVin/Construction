using Construction.Domain.Entities;

namespace Construction.Application.Schedule;

public record CreateConstructionPhaseCommand(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int PercentComplete,
    PhaseStatus Status,
    string? CheckpointLabel);
