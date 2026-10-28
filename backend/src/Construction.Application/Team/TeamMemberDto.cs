using Construction.Domain.Entities;

namespace Construction.Application.Team;

public record TeamMemberDto(
    Guid Id,
    Guid ProjectId,
    string FullName,
    string RoleTitle,
    string? Specialty,
    string Email,
    Guid? PhaseId,
    string? PhaseName,
    TeamMemberStatus Status,
    int ActiveTaskCount,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static TeamMemberDto From(TeamMember m, string? phaseName, int activeTaskCount) => new(
        m.Id, m.ProjectId, m.FullName, m.RoleTitle, m.Specialty, m.Email, m.PhaseId, phaseName,
        m.Status, activeTaskCount, m.CreatedAt, m.UpdatedAt);
}

public enum TeamMemberSaveStatus
{
    Saved,
    NotFound,
    DuplicateEmail,
}

public record TeamMemberSaveResult(TeamMemberSaveStatus Status, TeamMemberDto? Member = null);
