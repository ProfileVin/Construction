namespace Construction.Infrastructure.Persistence;

/// <summary>Seeded currency reference row. Label is derived (<c>"{Name} - {Symbol}"</c>).</summary>
public class Currency
{
    public int Id { get; set; }

    /// <summary>ISO 4217 code, e.g. <c>USD</c>. Persisted on <see cref="ApplicationUser.Currency"/>.</summary>
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Symbol { get; set; } = string.Empty;

    public int SortOrder { get; set; }
}
