using Construction.Domain.Entities;

namespace Construction.Application.Team;

public record TeamMemberListQuery(string? Search, string? Role, TeamMemberStatus? Status, int Page, int PageSize);
