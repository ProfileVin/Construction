namespace Construction.Application.Dashboard;

/// <summary>A manual "New Log" entry against an existing task (Task Log page).</summary>
public record CreateActivityLogCommand(
    Guid TaskId,
    string Category,
    string AssigneeName,
    string Note,
    TaskAttachment? Attachment = null);

/// <summary>The trade tags a manual log can carry.</summary>
public static class ActivityLogCategories
{
    public static readonly IReadOnlyList<string> All =
        ["Framing", "Structural", "Finishing", "Electrical", "Mechanical", "Plumbing"];
}
