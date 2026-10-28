using System.Text;

namespace Construction.Api.Features.Team;

public static class TeamCsv
{
    private static readonly string[] Header =
        ["Name", "Role / Trade", "Specialty", "Email", "Assigned Phase", "Active Tasks", "Status"];

    public static byte[] Write(IEnumerable<Construction.Application.Team.TeamMemberDto> members)
    {
        var sb = new StringBuilder();
        AppendRow(sb, Header);

        foreach (var m in members)
        {
            AppendRow(sb,
            [
                m.FullName, m.RoleTitle, m.Specialty, m.Email, m.PhaseName,
                m.ActiveTaskCount.ToString(System.Globalization.CultureInfo.InvariantCulture), m.Status.ToString(),
            ]);
        }

        // BOM so Excel opens it as UTF-8 (names like "O'Connell", accents).
        return [.. Encoding.UTF8.GetPreamble(), .. Encoding.UTF8.GetBytes(sb.ToString())];
    }

    private static void AppendRow(StringBuilder sb, IEnumerable<string?> cells)
    {
        sb.AppendJoin(',', cells.Select(Escape));
        sb.Append("\r\n");
    }

    // RFC 4180 quoting, plus a leading ' on formula-looking cells so a spreadsheet
    // doesn't execute user-entered text (CSV injection).
    private static string Escape(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        if (value[0] is '=' or '+' or '-' or '@' or '\t' or '\r')
        {
            value = "'" + value;
        }

        return value.IndexOfAny([',', '"', '\r', '\n']) >= 0
            ? $"\"{value.Replace("\"", "\"\"")}\""
            : value;
    }
}
