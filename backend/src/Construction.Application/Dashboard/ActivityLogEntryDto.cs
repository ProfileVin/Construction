using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

/// <param name="AssigneeName">The entry's own assignee (manual logs), else the linked task's.</param>
/// <param name="PhaseNumber">1-based position of the task's phase in start-date order (the "03." in "03. Electrical Rough-in").</param>
public record ActivityLogEntryDto(
    Guid Id,
    Guid ProjectId,
    Guid? ProjectTaskId,
    string LogNumber,
    string Description,
    DateTime OccurredAt,
    string? TaskTitle,
    string? AssigneeName,
    string? PhaseName,
    int? PhaseNumber,
    string? Category,
    Guid? AttachmentDocumentId)
{
    public static ActivityLogEntryDto From(
        ActivityLogEntry e, ProjectTask? task, ConstructionPhase? phase, int? phaseNumber) => new(
        e.Id, e.ProjectId, e.ProjectTaskId, e.LogNumber, e.Description, e.OccurredAt,
        task?.Title, e.AssigneeName ?? task?.AssigneeName, phase?.Name, phaseNumber, e.Category, e.AttachmentDocumentId);
}
