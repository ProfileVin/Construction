namespace Construction.Domain.Entities;

public class BudgetCategory
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public decimal AllocatedAmount { get; private set; }
    public decimal SpentAmount { get; private set; }
    public bool IsContingency { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private BudgetCategory()
    {
    }

    public static BudgetCategory Create(
        Guid projectId,
        string name,
        decimal allocatedAmount,
        decimal spentAmount,
        bool isContingency,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Category name is required.", nameof(name));
        }

        if (allocatedAmount < 0)
        {
            throw new ArgumentException("Allocated amount cannot be negative.", nameof(allocatedAmount));
        }

        if (spentAmount < 0)
        {
            throw new ArgumentException("Spent amount cannot be negative.", nameof(spentAmount));
        }

        return new BudgetCategory
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = name.Trim(),
            AllocatedAmount = allocatedAmount,
            SpentAmount = spentAmount,
            IsContingency = isContingency,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }
}
