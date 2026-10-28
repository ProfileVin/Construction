namespace Construction.Api.Features.Reference;

/// <summary>
/// Timezone list built once from the host's <see cref="TimeZoneInfo"/> database
/// (Windows ids normalised to IANA). Deliberately NOT a DB table — the OS is the
/// source of truth here. See ADR-0008.
/// </summary>
public static class TimeZoneCatalog
{
    private static readonly Lazy<IReadOnlyList<TimeZoneOption>> _timeZones = new(Build);

    public static IReadOnlyList<TimeZoneOption> TimeZones => _timeZones.Value;

    public static bool IsValidTimeZone(string id) => TimeZones.Any(o => o.Id == id);

    private static IReadOnlyList<TimeZoneOption> Build()
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var list = new List<TimeZoneOption>();

        foreach (var tz in TimeZoneInfo.GetSystemTimeZones())
        {
            var id = tz.Id;
            if (id.Contains('/') is false &&
                TimeZoneInfo.TryConvertWindowsIdToIanaId(id, out var iana) &&
                iana is not null)
            {
                id = iana;
            }

            if (!seen.Add(id))
            {
                continue;
            }

            var offset = tz.BaseUtcOffset;
            var sign = offset < TimeSpan.Zero ? "-" : "+";
            var label = $"(GMT{sign}{Math.Abs(offset.Hours):D2}:{Math.Abs(offset.Minutes):D2}) {id}";
            list.Add(new TimeZoneOption(id, label, (int)offset.TotalMinutes));
        }

        return list
            .OrderBy(o => o.GmtOffsetMinutes)
            .ThenBy(o => o.Id, StringComparer.Ordinal)
            .ToList();
    }
}
