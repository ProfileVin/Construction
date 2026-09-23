using Construction.Application.Team;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class TeamMemberRepository(AppDbContext db) : ITeamMemberRepository
{
    public async Task<(IReadOnlyList<TeamMember> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken)
    {
        var q = Filter(projectId, query);

        var totalCount = await q.CountAsync(cancellationToken);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderBy(m => m.FullName).ThenBy(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<TeamMember>> ListByProjectAsync(
        Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken)
    {
        return await Filter(projectId, query)
            .OrderBy(m => m.FullName).ThenBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<string>> ListRolesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.TeamMembers
            .Where(m => m.ProjectId == projectId)
            .Select(m => m.RoleTitle)
            .Distinct()
            .OrderBy(r => r)
            .ToListAsync(cancellationToken);
    }

    public async Task<TeamMember?> GetAsync(Guid projectId, Guid memberId, CancellationToken cancellationToken)
    {
        return await db.TeamMembers
            .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.Id == memberId, cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(
        Guid projectId, string email, Guid? exceptMemberId, CancellationToken cancellationToken)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await db.TeamMembers.AnyAsync(
            m => m.ProjectId == projectId && m.Email == normalized && m.Id != exceptMemberId,
            cancellationToken);
    }

    public Task AddAsync(TeamMember member, CancellationToken cancellationToken)
    {
        db.TeamMembers.Add(member);
        return Task.CompletedTask;
    }

    private IQueryable<TeamMember> Filter(Guid projectId, TeamMemberListQuery query)
    {
        var q = db.TeamMembers.Where(m => m.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            q = q.Where(m =>
                EF.Functions.Like(m.FullName, term) ||
                EF.Functions.Like(m.Email, term) ||
                EF.Functions.Like(m.RoleTitle, term) ||
                (m.Specialty != null && EF.Functions.Like(m.Specialty, term)));
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            var role = query.Role.Trim();
            q = q.Where(m => m.RoleTitle == role);
        }

        if (query.Status is { } status)
        {
            q = q.Where(m => m.Status == status);
        }

        return q;
    }
}
