namespace Construction.Application.Budget;

public record BudgetSummaryDto(
    IReadOnlyList<BudgetCategoryDto> Categories,
    decimal TotalAllocated,
    decimal TotalActualSpent,
    decimal RemainingBalance,
    decimal CommittedPOs,
    decimal UnbilledWork,
    decimal? ContingencyBurnPercent,
    string? ContingencyStatusLabel);
