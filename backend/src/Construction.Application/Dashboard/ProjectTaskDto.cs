using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public record ProjectTaskDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline,
    DateTime CreatedAt)
{
    public static ProjectTaskDto From(ProjectTask t) => new(
        t.Id, t.ProjectId, t.Title, t.AssigneeName, t.AssignedDate, t.Deadline, t.CreatedAt);
}
