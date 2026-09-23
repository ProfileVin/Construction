using Construction.Domain.Entities;

namespace Construction.Application.Documents;

public record DocumentListQuery(string? Search, DocumentFormat? Format, int Page, int PageSize);
