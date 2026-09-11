namespace Construction.Domain.Entities;

public class ProjectTask
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string AssigneeName { get; private set; } = string.Empty;
    public DateOnly AssignedDate { get; private set; }
    public DateOnly Deadline { get; private set; }
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

        return new ProjectTask
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Title = title.Trim(),
            AssigneeName = assigneeName.Trim(),
            AssignedDate = assignedDate,
            Deadline = deadline,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }
}
