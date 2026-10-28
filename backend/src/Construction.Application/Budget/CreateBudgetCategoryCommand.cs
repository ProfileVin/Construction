namespace Construction.Application.Budget;

public record CreateBudgetCategoryCommand(
    string Name,
    decimal AllocatedAmount,
    decimal SpentAmount,
    bool IsContingency);
