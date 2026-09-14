using Construction.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Construction.Api.Features.Reference;

[ApiController]
[Route("api/reference")]
public class ReferenceController(AppDbContext db) : ControllerBase
{
    [HttpGet("options")]
    public async Task<IResult> GetOptionsAsync()
    {
        var lookups = await db.LookupOptions
            .OrderBy(o => o.Category)
            .ThenBy(o => o.SortOrder)
            .ToListAsync();

        var currencies = await db.Currencies
            .OrderBy(c => c.SortOrder)
            .Select(c => new CurrencyOption(c.Code, c.Name, c.Symbol))
            .ToListAsync();

        IReadOnlyList<OptionItem> ByCategory(string category) => lookups
            .Where(o => o.Category == category)
            .Select(o => new OptionItem(o.Value, o.Label, o.Hint))
            .ToList();

        var dto = new ReferenceOptionsDto(
            MeasurementSystems: ByCategory(LookupCategories.MeasurementSystem),
            TemperatureUnits: ByCategory(LookupCategories.TemperatureUnit),
            Currencies: currencies,
            TimeZones: TimeZoneCatalog.TimeZones,
            CompanyDescriptions: ByCategory(LookupCategories.CompanyDescription),
            CountryCodes: ByCategory(LookupCategories.CountryCode),
            StartModes: ByCategory(LookupCategories.StartMode),
            ProjectTypes: ByCategory(LookupCategories.ProjectType),
            ProjectStatuses: ByCategory(LookupCategories.ProjectStatus));

        return Results.Ok(dto);
    }
}
