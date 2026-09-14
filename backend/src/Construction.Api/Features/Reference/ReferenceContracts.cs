namespace Construction.Api.Features.Reference;

/// <summary>Generic dropdown / card row. <c>Hint</c> is supporting copy where a list has it.</summary>
public record OptionItem(string Value, string Label, string? Hint = null);

public record CurrencyOption(string Code, string Name, string Symbol)
{
    public string Label => $"{Name} - {Symbol}";
}

public record TimeZoneOption(string Id, string Label, int GmtOffsetMinutes);

/// <summary>Every seeded reference list the SPA needs, served by <c>GET /api/reference/options</c>.</summary>
public record ReferenceOptionsDto(
    IReadOnlyList<OptionItem> MeasurementSystems,
    IReadOnlyList<OptionItem> TemperatureUnits,
    IReadOnlyList<CurrencyOption> Currencies,
    IReadOnlyList<TimeZoneOption> TimeZones,
    IReadOnlyList<OptionItem> CompanyDescriptions,
    IReadOnlyList<OptionItem> CountryCodes,
    IReadOnlyList<OptionItem> StartModes,
    IReadOnlyList<OptionItem> ProjectTypes,
    IReadOnlyList<OptionItem> ProjectStatuses);
