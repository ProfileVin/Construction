namespace Construction.Domain.Entities;

public enum TeamMemberStatus
{
    Active,
    Deactivated,
}

public class TeamMember
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string RoleTitle { get; private set; } = string.Empty;
    public string? Specialty { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public Guid? PhaseId { get; private set; }
    public TeamMemberStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private TeamMember()
    {
    }

    public static TeamMember Create(
        Guid projectId,
        string fullName,
        string roleTitle,
        string? specialty,
        string email,
        Guid? phaseId,
        TeamMemberStatus status,
        DateTime nowUtc)
    {
        var member = new TeamMember
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Status = status,
            CreatedAt = nowUtc,
        };
        member.Update(fullName, roleTitle, specialty, email, phaseId, nowUtc);
        return member;
    }

    public void Update(string fullName, string roleTitle, string? specialty, string email, Guid? phaseId, DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Name is required.", nameof(fullName));
        }

        if (string.IsNullOrWhiteSpace(roleTitle))
        {
            throw new ArgumentException("Role is required.", nameof(roleTitle));
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email is required.", nameof(email));
        }

        FullName = fullName.Trim();
        RoleTitle = roleTitle.Trim();
        Specialty = string.IsNullOrWhiteSpace(specialty) ? null : specialty.Trim();
        Email = email.Trim().ToLowerInvariant();
        PhaseId = phaseId;
        UpdatedAt = nowUtc;
    }

    public void SetStatus(TeamMemberStatus status, DateTime nowUtc)
    {
        Status = status;
        UpdatedAt = nowUtc;
    }
}
