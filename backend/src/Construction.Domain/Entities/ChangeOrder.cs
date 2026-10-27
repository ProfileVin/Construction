namespace Construction.Domain.Entities;

public enum ChangeOrderStatus
{
    Pending,
    Approved,
    Rejected,
}

/// <summary>A requested change to the contract scope; approved ones add to the contract value (ADR-0025).</summary>
public class ChangeOrder
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }

    /// <summary>Per-project running number (max + 1, unique per project), as for purchase orders.</summary>
    public int Sequence { get; private set; }
    public string CoNumber { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public ChangeOrderStatus Status { get; private set; }
    public DateOnly RequestedDate { get; private set; }
    public string? Reason { get; private set; }

    /// <summary>When it was approved or rejected; null while Pending.</summary>
    public DateTime? DecidedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ChangeOrder()
    {
    }

    public static ChangeOrder Create(
        Guid projectId,
        int sequence,
        string description,
        decimal amount,
        DateOnly requestedDate,
        string? reason,
        DateTime nowUtc)
    {
        if (sequence <= 0)
        {
            throw new ArgumentException("Sequence must be positive.", nameof(sequence));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Description is required.", nameof(description));
        }

        if (amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));
        }

        return new ChangeOrder
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Sequence = sequence,
            CoNumber = $"CO-{sequence:0000}",
            Description = description.Trim(),
            Amount = Math.Round(amount, 2),
            Status = ChangeOrderStatus.Pending,
            RequestedDate = requestedDate,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }

    public void Approve(DateTime nowUtc) => Decide(ChangeOrderStatus.Approved, nowUtc);

    public void Reject(DateTime nowUtc) => Decide(ChangeOrderStatus.Rejected, nowUtc);

    private void Decide(ChangeOrderStatus status, DateTime nowUtc)
    {
        if (Status != ChangeOrderStatus.Pending)
        {
            throw new InvalidOperationException($"{CoNumber} has already been {Status.ToString().ToLowerInvariant()}.");
        }

        Status = status;
        DecidedAt = nowUtc;
        UpdatedAt = nowUtc;
    }
}
