namespace Construction.Domain.Entities;

public class ActivityLogEntry
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public Guid? ProjectTaskId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public DateTime OccurredAt { get; private set; }

    private ActivityLogEntry()
    {
    }

    public static ActivityLogEntry Create(
        Guid projectId,
        string description,
        Guid? projectTaskId,
        DateTime occurredAtUtc)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        return new ActivityLogEntry
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            ProjectTaskId = projectTaskId,
            Description = description.Trim(),
            OccurredAt = occurredAtUtc,
        };
    }
}
