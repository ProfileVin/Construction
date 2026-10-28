using Construction.Domain.Entities;

namespace Construction.Application.Payments;

public interface IPaymentRepository
{
    Task<(IReadOnlyList<Payment> Items, int TotalCount)> SearchAsync(
        Guid projectId, PaymentListQuery query, CancellationToken cancellationToken);

    Task<Payment?> GetAsync(Guid projectId, Guid paymentId, CancellationToken cancellationToken);

    /// <summary>max(Sequence) + 1 — not a count, so deleting an older payment can't produce a duplicate number.</summary>
    Task<int> NextSequenceAsync(Guid projectId, CancellationToken cancellationToken);

    Task<PaymentSummaryDto> GetClearedTotalsAsync(Guid projectId, CancellationToken cancellationToken);

    /// <summary>Distinct payer/payee names already used on the project: payments, PO vendors and invoice vendors.</summary>
    Task<IReadOnlyList<string>> GetPartyNamesAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(Payment payment, CancellationToken cancellationToken);

    void Remove(Payment payment);
}
