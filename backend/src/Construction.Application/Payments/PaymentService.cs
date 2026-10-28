using Construction.Application.Common;
using Construction.Application.Projects;
using Construction.Domain.Entities;

namespace Construction.Application.Payments;

public class PaymentService(
    IProjectRepository projects,
    IPaymentRepository payments,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IPaymentService
{
    public async Task<PagedResult<PaymentDto>?> SearchAsync(
        string ownerId, Guid projectId, PaymentListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await payments.SearchAsync(projectId, query, cancellationToken);
        return new PagedResult<PaymentDto>(
            items.Select(PaymentDto.From).ToList(), totalCount,
            Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<PaymentSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        return await payments.GetClearedTotalsAsync(projectId, cancellationToken);
    }

    public async Task<IReadOnlyList<string>?> GetPartyNamesAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        return await payments.GetPartyNamesAsync(projectId, cancellationToken);
    }

    public async Task<PaymentDto?> CreateAsync(
        string ownerId, Guid projectId, CreatePaymentCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var sequence = await payments.NextSequenceAsync(projectId, cancellationToken);
        var payment = Payment.Create(
            projectId,
            sequence,
            command.Direction,
            command.PartyName,
            command.Amount,
            command.PaymentDate,
            command.Method,
            command.Notes,
            timeProvider.GetUtcNow().UtcDateTime);

        await payments.AddAsync(payment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PaymentDto.From(payment);
    }

    public async Task<PaymentDto?> MarkClearedAsync(
        string ownerId, Guid projectId, Guid paymentId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var payment = await payments.GetAsync(projectId, paymentId, cancellationToken);
        if (payment is null)
        {
            return null;
        }

        payment.MarkCleared(timeProvider.GetUtcNow().UtcDateTime);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PaymentDto.From(payment);
    }

    public async Task<PaymentDeleteStatus> DeleteAsync(
        string ownerId, Guid projectId, Guid paymentId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return PaymentDeleteStatus.NotFound;
        }

        var payment = await payments.GetAsync(projectId, paymentId, cancellationToken);
        if (payment is null)
        {
            return PaymentDeleteStatus.NotFound;
        }

        if (payment.Status != PaymentStatus.Processing)
        {
            return PaymentDeleteStatus.NotProcessing;
        }

        payments.Remove(payment);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PaymentDeleteStatus.Deleted;
    }
}
