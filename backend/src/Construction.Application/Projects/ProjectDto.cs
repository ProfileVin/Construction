using Construction.Domain.Entities;

namespace Construction.Application.Projects;

public record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    ProjectType Type,
    ProjectStatus Status,
    decimal BudgetTotal,
    decimal TotalSpent,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static ProjectDto From(Project p) => new(
        p.Id, p.Name, p.Description, p.Type, p.Status, p.BudgetTotal, p.TotalSpent, p.CreatedAt, p.UpdatedAt);
}
