namespace Construction.Domain.Entities;

public enum ProjectType
{
    NewHome,
    MinorRenovation,
    MajorRenovation,
    Refurb,
    Remodeling,
    Commercial,
    Maintenance,
    Other,
}

public enum ProjectStatus
{
    New,
    InProgress,
    Lost,
    Completed,
    Archived,
    Other,
}

public class Project
{
    public Guid Id { get; private set; }
    public string OwnerId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ProjectType Type { get; private set; }
    public ProjectStatus Status { get; private set; }
    public decimal BudgetTotal { get; private set; }
    public decimal TotalSpent { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Project()
    {
    }

    public static Project Create(
        string ownerId,
        string name,
        ProjectType type,
        ProjectStatus status,
        string? description,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Project name is required.", nameof(name));
        }

        return new Project
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = name.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            Type = type,
            Status = status,
            BudgetTotal = 0m,
            TotalSpent = 0m,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }

    public void SetBudget(decimal budgetTotal, decimal totalSpent, DateTime nowUtc)
    {
        BudgetTotal = budgetTotal;
        TotalSpent = totalSpent;
        UpdatedAt = nowUtc;
    }
}
