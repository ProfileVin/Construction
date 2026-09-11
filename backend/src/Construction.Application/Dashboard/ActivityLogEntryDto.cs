using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public record ActivityLogEntryDto(
    Guid Id,
    Guid ProjectId,
    Guid? ProjectTaskId,
    string Description,
    DateTime OccurredAt)
{
    public static ActivityLogEntryDto From(ActivityLogEntry e) => new(
        e.Id, e.ProjectId, e.ProjectTaskId, e.Description, e.OccurredAt);
}
