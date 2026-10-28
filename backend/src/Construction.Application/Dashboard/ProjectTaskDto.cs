using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public record ProjectTaskDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline,
    Guid? PhaseId,
    string? PhaseName,
    ProjectTaskStatus Status,
    DateTime CreatedAt)
{
    public static ProjectTaskDto From(ProjectTask t, string? phaseName) => new(
        t.Id, t.ProjectId, t.Title, t.AssigneeName, t.AssignedDate, t.Deadline,
        t.PhaseId, phaseName, t.Status, t.CreatedAt);
}
