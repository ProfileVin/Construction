namespace Construction.Domain.Entities;

/// <summary>Pending = awaiting the general contractor's review; PendingOwnerApproval = reviewed, awaiting owner sign-off.</summary>
public enum ChangeOrderStatus
{
    Pending,
    Approved,
    Rejected,
    PendingOwnerApproval,
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

    /// <summary>One of the fixed reason codes (Client Request, Design Change, …).</summary>
    public string? Reason { get; private set; }

    /// <summary>Free-text summary &amp; scope of the change.</summary>
    public string? Scope { get; private set; }
    public Guid? CategoryId { get; private set; }
    public int ScheduleImpactDays { get; private set; }
    public string? RequestedByName { get; private set; }

    /// <summary>Step 1 — general contractor review (also set when rejected at this step).</summary>
    public DateTime? ContractorReviewedAt { get; private set; }
    public string? ContractorReviewedByName { get; private set; }

    /// <summary>Step 2 — owner sign-off; with <see cref="DecidedAt"/> once the owner approves or rejects.</summary>
    public string? OwnerDecidedByName { get; private set; }

    /// <summary>When it was finally approved or rejected; null while either step is pending.</summary>
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
        DateTime nowUtc,
        string? scope = null,
        Guid? categoryId = null,
        int scheduleImpactDays = 0,
        string? requestedByName = null)
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

        if (scheduleImpactDays < 0)
        {
            throw new ArgumentException("Schedule impact can't be negative.", nameof(scheduleImpactDays));
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
            Scope = string.IsNullOrWhiteSpace(scope) ? null : scope.Trim(),
            CategoryId = categoryId,
            ScheduleImpactDays = scheduleImpactDays,
            RequestedByName = string.IsNullOrWhiteSpace(requestedByName) ? null : requestedByName.Trim(),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }

    public bool IsAwaitingDecision =>
        Status is ChangeOrderStatus.Pending or ChangeOrderStatus.PendingOwnerApproval;

    /// <summary>GC review moves it to owner sign-off; owner sign-off approves it.</summary>
    public void Approve(string byName, DateTime nowUtc)
    {
        EnsureAwaitingDecision();
        if (Status == ChangeOrderStatus.Pending)
        {
            ContractorReviewedAt = nowUtc;
            ContractorReviewedByName = byName;
            Status = ChangeOrderStatus.PendingOwnerApproval;
        }
        else
        {
            OwnerDecidedByName = byName;
            DecidedAt = nowUtc;
            Status = ChangeOrderStatus.Approved;
        }

        UpdatedAt = nowUtc;
    }

    /// <summary>Rejects at whichever step is current; the step's signer is recorded.</summary>
    public void Reject(string byName, DateTime nowUtc)
    {
        EnsureAwaitingDecision();
        if (Status == ChangeOrderStatus.Pending)
        {
            ContractorReviewedAt = nowUtc;
            ContractorReviewedByName = byName;
        }
        else
        {
            OwnerDecidedByName = byName;
        }

        DecidedAt = nowUtc;
        Status = ChangeOrderStatus.Rejected;
        UpdatedAt = nowUtc;
    }

    private void EnsureAwaitingDecision()
    {
        if (!IsAwaitingDecision)
        {
            throw new InvalidOperationException($"{CoNumber} has already been {Status.ToString().ToLowerInvariant()}.");
        }
    }
}

/// <summary>Links a change order to one of its uploaded <see cref="ProjectDocument"/>s.</summary>
public class ChangeOrderAttachment
{
    public Guid ChangeOrderId { get; private set; }
    public Guid DocumentId { get; private set; }

    private ChangeOrderAttachment()
    {
    }

    public static ChangeOrderAttachment Create(Guid changeOrderId, Guid documentId) =>
        new() { ChangeOrderId = changeOrderId, DocumentId = documentId };
}
