using Construction.Domain.Entities;

namespace Construction.Application.Projects;

public record CreateProjectCommand(
    string Name,
    ProjectType Type,
    ProjectStatus Status,
    string? Description,
    decimal? BudgetTotal = null,
    decimal? TotalSpent = null);
