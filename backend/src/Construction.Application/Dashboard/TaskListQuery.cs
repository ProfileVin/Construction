using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public record TaskListQuery(
    string? Search,
    Guid? PhaseId,
    ProjectTaskStatus? Status,
    DateOnly? FromDate,
    DateOnly? ToDate,
    int Page,
    int PageSize);
