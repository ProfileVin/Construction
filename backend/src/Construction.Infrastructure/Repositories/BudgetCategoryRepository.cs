using Construction.Application.Budget;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class BudgetCategoryRepository(AppDbContext db) : IBudgetCategoryRepository
{
    public async Task<IReadOnlyList<BudgetCategory>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.BudgetCategories
            .Where(c => c.ProjectId == projectId)
            .OrderByDescending(c => c.AllocatedAmount).ThenBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(BudgetCategory category, CancellationToken cancellationToken)
    {
        db.BudgetCategories.Add(category);
        return Task.CompletedTask;
    }
}
