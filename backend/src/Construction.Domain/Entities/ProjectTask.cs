namespace Construction.Domain.Entities;

public enum ProjectTaskStatus
{
    Upcoming,
    InProgress,
    Completed,
    OnHold,
    PendingReview,
}

public class ProjectTask
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string AssigneeName { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateOnly AssignedDate { get; private set; }
    public DateOnly Deadline { get; private set; }
    public Guid? PhaseId { get; private set; }
    public ProjectTaskStatus Status { get; private set; }
    public Guid? AttachmentDocumentId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ProjectTask()
    {
    }

    public static ProjectTask Create(
        Guid projectId,
        string title,
        string assigneeName,
        DateOnly assignedDate,
        DateOnly deadline,
        Guid? phaseId,
        ProjectTaskStatus status,
        DateTime nowUtc,
        Guid? attachmentDocumentId = null)
    {
        var task = new ProjectTask
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            AttachmentDocumentId = attachmentDocumentId,
            CreatedAt = nowUtc,
        };
        task.Update(title, assigneeName, assignedDate, deadline, phaseId, status, null, nowUtc);
        return task;
    }

    /// <summary>Further attachments live in <see cref="ProjectTaskAttachment"/>; this one is set at creation.</summary>
    public void Update(
        string title,
        string assigneeName,
        DateOnly assignedDate,
        DateOnly deadline,
        Guid? phaseId,
        ProjectTaskStatus status,
        string? description,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Task title is required.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(assigneeName))
        {
            throw new ArgumentException("Assignee is required.", nameof(assigneeName));
        }

        if (deadline < assignedDate)
        {
            throw new ArgumentException("Deadline must be on or after the assigned date.", nameof(deadline));
        }

        Title = title.Trim();
        AssigneeName = assigneeName.Trim();
        AssignedDate = assignedDate;
        Deadline = deadline;
        PhaseId = phaseId;
        Status = status;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        UpdatedAt = nowUtc;
    }

    /// <summary>Unlinks the creation-time attachment; the document itself stays in the library.</summary>
    public void ClearAttachment() => AttachmentDocumentId = null;
}

/// <summary>Links a task to one of its uploaded <see cref="ProjectDocument"/>s (added via Edit Task Log).</summary>
public class ProjectTaskAttachment
{
    public Guid ProjectTaskId { get; private set; }
    public Guid DocumentId { get; private set; }

    private ProjectTaskAttachment()
    {
    }

    public static ProjectTaskAttachment Create(Guid projectTaskId, Guid documentId) =>
        new() { ProjectTaskId = projectTaskId, DocumentId = documentId };
}
