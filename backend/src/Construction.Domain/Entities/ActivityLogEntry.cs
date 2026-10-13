namespace Construction.Domain.Entities;

public class ActivityLogEntry
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public Guid? ProjectTaskId { get; private set; }

    /// <summary>Human-facing reference, e.g. "LOG-2026-081" (per-project sequence, server-generated).</summary>
    public string LogNumber { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public DateTime OccurredAt { get; private set; }

    /// <summary>Who the log is about; set on manual "New Log" entries, otherwise the linked task's assignee applies.</summary>
    public string? AssigneeName { get; private set; }

    /// <summary>Trade tag from a manual log (Framing, Structural, …).</summary>
    public string? Category { get; private set; }

    public Guid? AttachmentDocumentId { get; private set; }

    private ActivityLogEntry()
    {
    }

    public static ActivityLogEntry Create(
        Guid projectId,
        string logNumber,
        string description,
        Guid? projectTaskId,
        DateTime occurredAtUtc,
        string? assigneeName = null,
        string? category = null,
        Guid? attachmentDocumentId = null)
    {
        if (string.IsNullOrWhiteSpace(logNumber))
        {
            throw new ArgumentException("Log number is required.", nameof(logNumber));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        return new ActivityLogEntry
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            ProjectTaskId = projectTaskId,
            LogNumber = logNumber.Trim(),
            Description = description.Trim(),
            OccurredAt = occurredAtUtc,
            AssigneeName = string.IsNullOrWhiteSpace(assigneeName) ? null : assigneeName.Trim(),
            Category = string.IsNullOrWhiteSpace(category) ? null : category.Trim(),
            AttachmentDocumentId = attachmentDocumentId,
        };
    }

    public void UpdateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        Description = description.Trim();
    }
}
