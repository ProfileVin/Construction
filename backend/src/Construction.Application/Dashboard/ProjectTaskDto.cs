using Construction.Application.ChangeOrders;
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
    Guid? AttachmentDocumentId,
    DateTime CreatedAt,
    string? Description,
    IReadOnlyList<ChangeOrderAttachmentDto> Attachments)
{
    /// <summary>Attachments are only filled by the single-task read and the update; lists leave them empty.</summary>
    public static ProjectTaskDto From(
        ProjectTask t, string? phaseName, IReadOnlyList<ProjectDocument>? attachments = null) => new(
        t.Id, t.ProjectId, t.Title, t.AssigneeName, t.AssignedDate, t.Deadline,
        t.PhaseId, phaseName, t.Status, t.AttachmentDocumentId, t.CreatedAt, t.Description,
        (attachments ?? []).Select(d => new ChangeOrderAttachmentDto(d.Id, d.OriginalFileName, d.SizeBytes, d.Format)).ToList());
}
