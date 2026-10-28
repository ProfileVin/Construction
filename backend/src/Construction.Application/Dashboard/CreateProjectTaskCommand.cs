using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public record CreateProjectTaskCommand(
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline,
    Guid? PhaseId,
    ProjectTaskStatus Status,
    TaskAttachment? Attachment = null);

/// <summary>An optional file sent with a new task; stored as a <see cref="ProjectDocument"/>.</summary>
public record TaskAttachment(string FileName, string ContentType, long SizeBytes, Stream Content);
