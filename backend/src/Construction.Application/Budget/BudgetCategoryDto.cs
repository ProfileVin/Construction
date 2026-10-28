using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public record BudgetCategoryDto(
    Guid Id,
    Guid ProjectId,
    string Name,
    decimal AllocatedAmount,
    decimal SpentAmount,
    bool IsContingency,
    DateTime CreatedAt)
{
    public static BudgetCategoryDto From(BudgetCategory c) => new(
        c.Id, c.ProjectId, c.Name, c.AllocatedAmount, c.SpentAmount, c.IsContingency, c.CreatedAt);
}
