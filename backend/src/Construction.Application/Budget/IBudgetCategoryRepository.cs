using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public interface IBudgetCategoryRepository
{
    Task<IReadOnlyList<BudgetCategory>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(BudgetCategory category, CancellationToken cancellationToken);
}
