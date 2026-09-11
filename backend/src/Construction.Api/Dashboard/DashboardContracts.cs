namespace Construction.Api.Dashboard;

public record CreateProjectTaskRequest(
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline);

public record ProjectTaskDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline,
    DateTime CreatedAt)
{
    public static ProjectTaskDto From(Construction.Application.Dashboard.ProjectTaskDto t) => new(
        t.Id, t.ProjectId, t.Title, t.AssigneeName, t.AssignedDate, t.Deadline, t.CreatedAt);
}

public record ActivityLogEntryDto(
    Guid Id,
    Guid ProjectId,
    Guid? ProjectTaskId,
    string Description,
    DateTime OccurredAt)
{
    public static ActivityLogEntryDto From(Construction.Application.Dashboard.ActivityLogEntryDto e) => new(
        e.Id, e.ProjectId, e.ProjectTaskId, e.Description, e.OccurredAt);
}
