namespace Construction.Domain.Entities;

public enum PaymentDirection
{
    /// <summary>Client payment received.</summary>
    Inbound,

    /// <summary>Vendor disbursement sent.</summary>
    Outbound,
}

public enum PaymentMethod
{
    Ach,
    Wire,
    PayPal,
    Check,
}

public enum PaymentStatus
{
    Processing,
    Cleared,
}

/// <summary>A standalone payment ledger row — not linked to invoices or POs (ADR-0028).</summary>
public class Payment
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }

    /// <summary>Per-project running number (max + 1, unique per project).</summary>
    public int Sequence { get; private set; }
    public string PaymentNumber { get; private set; } = string.Empty;
    public PaymentDirection Direction { get; private set; }
    public string PartyName { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateOnly PaymentDate { get; private set; }
    public PaymentMethod Method { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Payment()
    {
    }

    public static Payment Create(
        Guid projectId,
        int sequence,
        PaymentDirection direction,
        string partyName,
        decimal amount,
        DateOnly paymentDate,
        PaymentMethod method,
        string? notes,
        DateTime nowUtc)
    {
        if (sequence <= 0)
        {
            throw new ArgumentException("Sequence must be positive.", nameof(sequence));
        }

        if (string.IsNullOrWhiteSpace(partyName))
        {
            throw new ArgumentException("Client/payee is required.", nameof(partyName));
        }

        if (amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));
        }

        return new Payment
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Sequence = sequence,
            PaymentNumber = $"PAY-{sequence:0000}",
            Direction = direction,
            PartyName = partyName.Trim(),
            Amount = Math.Round(amount, 2),
            PaymentDate = paymentDate,
            Method = method,
            Status = PaymentStatus.Processing,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }

    public void MarkCleared(DateTime nowUtc)
    {
        if (Status == PaymentStatus.Cleared)
        {
            return;
        }

        Status = PaymentStatus.Cleared;
        UpdatedAt = nowUtc;
    }
}
