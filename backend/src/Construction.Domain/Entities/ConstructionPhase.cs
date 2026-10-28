namespace Construction.Domain.Entities;

public enum PhaseStatus
{
    Upcoming,
    InProgress,
    Completed,
}

public class ConstructionPhase
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public int PercentComplete { get; private set; }
    public PhaseStatus Status { get; private set; }
    public string? CheckpointLabel { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ConstructionPhase()
    {
    }

    public static ConstructionPhase Create(
        Guid projectId,
        string name,
        DateOnly startDate,
        DateOnly endDate,
        int percentComplete,
        PhaseStatus status,
        string? checkpointLabel,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Phase name is required.", nameof(name));
        }

        if (endDate < startDate)
        {
            throw new ArgumentException("End date must be on or after the start date.", nameof(endDate));
        }

        if (percentComplete is < 0 or > 100)
        {
            throw new ArgumentException("Percent complete must be between 0 and 100.", nameof(percentComplete));
        }

        return new ConstructionPhase
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = name.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            PercentComplete = percentComplete,
            Status = status,
            CheckpointLabel = string.IsNullOrWhiteSpace(checkpointLabel) ? null : checkpointLabel.Trim(),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }
}
