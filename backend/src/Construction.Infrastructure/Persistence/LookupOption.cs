namespace Construction.Infrastructure.Persistence;

/// <summary>
/// Generic seeded reference row for the UI dropdowns / card lists. One table
/// holds every simple value+label list; <see cref="Category"/> partitions them
/// (see <see cref="LookupCategories"/>). Currencies have their own table
/// (<see cref="Currency"/>) because they carry a symbol + derived label.
/// </summary>
public class LookupOption
{
    public int Id { get; set; }

    /// <summary>Which list this row belongs to — a <see cref="LookupCategories"/> constant.</summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>Stored value (persisted on the user/project) or, for the project enums, the enum member name.</summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>Display text.</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Optional supporting copy (company-description hint, start-mode blurb).</summary>
    public string? Hint { get; set; }

    public int SortOrder { get; set; }
}
