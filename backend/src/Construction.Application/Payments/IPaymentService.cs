using Construction.Application.Common;

namespace Construction.Application.Payments;

public interface IPaymentService
{
    Task<PagedResult<PaymentDto>?> SearchAsync(
        string ownerId, Guid projectId, PaymentListQuery query, CancellationToken cancellationToken);

    Task<PaymentSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>?> GetPartyNamesAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<PaymentDto?> CreateAsync(
        string ownerId, Guid projectId, CreatePaymentCommand command, CancellationToken cancellationToken);

    Task<PaymentDto?> MarkClearedAsync(string ownerId, Guid projectId, Guid paymentId, CancellationToken cancellationToken);

    /// <summary>Only Processing payments can be deleted; a Cleared one has already moved money.</summary>
    Task<PaymentDeleteStatus> DeleteAsync(string ownerId, Guid projectId, Guid paymentId, CancellationToken cancellationToken);
}
