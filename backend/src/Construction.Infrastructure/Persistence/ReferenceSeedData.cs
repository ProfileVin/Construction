using Construction.Domain.Entities;

namespace Construction.Infrastructure.Persistence;

/// <summary>
/// Canonical rows for the seeded reference tables. Applied through EF Core
/// <c>HasData</c> in <see cref="AppDbContext.OnModelCreating"/>, so the data
/// ships inside migrations and lands in every environment. Ids are fixed and
/// must stay stable; add new rows with a fresh id and a new migration.
/// </summary>
public static class ReferenceSeedData
{
    public static readonly Currency[] Currencies =
    [
        new() { Id = 1, Code = "USD", Name = "US Dollar", Symbol = "$", SortOrder = 1 },
        new() { Id = 2, Code = "EUR", Name = "Euro", Symbol = "€", SortOrder = 2 },
        new() { Id = 3, Code = "GBP", Name = "British Pound", Symbol = "£", SortOrder = 3 },
        new() { Id = 4, Code = "CAD", Name = "Canadian Dollar", Symbol = "CA$", SortOrder = 4 },
        new() { Id = 5, Code = "AUD", Name = "Australian Dollar", Symbol = "A$", SortOrder = 5 },
        new() { Id = 6, Code = "NZD", Name = "New Zealand Dollar", Symbol = "NZ$", SortOrder = 6 },
        new() { Id = 7, Code = "JPY", Name = "Japanese Yen", Symbol = "¥", SortOrder = 7 },
        new() { Id = 8, Code = "CNY", Name = "Chinese Yuan", Symbol = "CN¥", SortOrder = 8 },
        new() { Id = 9, Code = "INR", Name = "Indian Rupee", Symbol = "₹", SortOrder = 9 },
        new() { Id = 10, Code = "SGD", Name = "Singapore Dollar", Symbol = "S$", SortOrder = 10 },
        new() { Id = 11, Code = "HKD", Name = "Hong Kong Dollar", Symbol = "HK$", SortOrder = 11 },
        new() { Id = 12, Code = "CHF", Name = "Swiss Franc", Symbol = "CHF", SortOrder = 12 },
        new() { Id = 13, Code = "SEK", Name = "Swedish Krona", Symbol = "kr", SortOrder = 13 },
        new() { Id = 14, Code = "NOK", Name = "Norwegian Krone", Symbol = "kr", SortOrder = 14 },
        new() { Id = 15, Code = "DKK", Name = "Danish Krone", Symbol = "kr", SortOrder = 15 },
        new() { Id = 16, Code = "PLN", Name = "Polish Złoty", Symbol = "zł", SortOrder = 16 },
        new() { Id = 17, Code = "ZAR", Name = "South African Rand", Symbol = "R", SortOrder = 17 },
        new() { Id = 18, Code = "AED", Name = "UAE Dirham", Symbol = "د.إ", SortOrder = 18 },
        new() { Id = 19, Code = "SAR", Name = "Saudi Riyal", Symbol = "﷼", SortOrder = 19 },
        new() { Id = 20, Code = "BRL", Name = "Brazilian Real", Symbol = "R$", SortOrder = 20 },
        new() { Id = 21, Code = "MXN", Name = "Mexican Peso", Symbol = "MX$", SortOrder = 21 },
        new() { Id = 22, Code = "PHP", Name = "Philippine Peso", Symbol = "₱", SortOrder = 22 },
        new() { Id = 23, Code = "IDR", Name = "Indonesian Rupiah", Symbol = "Rp", SortOrder = 23 },
        new() { Id = 24, Code = "MYR", Name = "Malaysian Ringgit", Symbol = "RM", SortOrder = 24 },
        new() { Id = 25, Code = "NGN", Name = "Nigerian Naira", Symbol = "₦", SortOrder = 25 },
        new() { Id = 26, Code = "KES", Name = "Kenyan Shilling", Symbol = "KSh", SortOrder = 26 },
    ];

    public static readonly LookupOption[] LookupOptions =
    [
        // --- Measurement systems (ids 100-109) ---
        new() { Id = 100, Category = LookupCategories.MeasurementSystem, Value = "Metric", Label = "Metric System: kg, m, m² etc.", SortOrder = 1 },
        new() { Id = 101, Category = LookupCategories.MeasurementSystem, Value = "Imperial", Label = "Imperial System: lb, ft, ft² etc.", SortOrder = 2 },

        // --- Temperature units (ids 110-119) ---
        new() { Id = 110, Category = LookupCategories.TemperatureUnit, Value = "Celsius", Label = "Celsius", SortOrder = 1 },
        new() { Id = 111, Category = LookupCategories.TemperatureUnit, Value = "Fahrenheit", Label = "Fahrenheit", SortOrder = 2 },

        // --- Company descriptions (ids 120-129) ---
        new() { Id = 120, Category = LookupCategories.CompanyDescription, Value = "Builder", Label = "Building homes", Hint = "Builder", SortOrder = 1 },
        new() { Id = 121, Category = LookupCategories.CompanyDescription, Value = "Remodeler", Label = "Remodeling", Hint = "Remodeler / renovations", SortOrder = 2 },
        new() { Id = 122, Category = LookupCategories.CompanyDescription, Value = "ConstructionManager", Label = "Coordinate and supervise", Hint = "Construction manager", SortOrder = 3 },
        new() { Id = 123, Category = LookupCategories.CompanyDescription, Value = "Other", Label = "Others", Hint = null, SortOrder = 4 },

        // --- Phone country calling codes (ids 130-149) ---
        new() { Id = 130, Category = LookupCategories.CountryCode, Value = "+1", Label = "+1", SortOrder = 1 },
        new() { Id = 131, Category = LookupCategories.CountryCode, Value = "+44", Label = "+44", SortOrder = 2 },
        new() { Id = 132, Category = LookupCategories.CountryCode, Value = "+61", Label = "+61", SortOrder = 3 },
        new() { Id = 133, Category = LookupCategories.CountryCode, Value = "+63", Label = "+63", SortOrder = 4 },
        new() { Id = 134, Category = LookupCategories.CountryCode, Value = "+65", Label = "+65", SortOrder = 5 },
        new() { Id = 135, Category = LookupCategories.CountryCode, Value = "+81", Label = "+81", SortOrder = 6 },
        new() { Id = 136, Category = LookupCategories.CountryCode, Value = "+91", Label = "+91", SortOrder = 7 },

        // --- Onboarding start modes (ids 150-159) ---
        new() { Id = 150, Category = LookupCategories.StartMode, Value = "Scratch", Label = "Create a project from scratch", Hint = "Start from scratch and build your project by filling in your own data", SortOrder = 1 },
        new() { Id = 151, Category = LookupCategories.StartMode, Value = "Template", Label = "Choose from project template", Hint = "Select a project template from our list of templates", SortOrder = 2 },

        // --- Project type labels (ids 160-179) — Value = nameof(ProjectType.X) ---
        new() { Id = 160, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.NewHome), Label = "New Home", SortOrder = 1 },
        new() { Id = 161, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.MinorRenovation), Label = "Minor renovation", SortOrder = 2 },
        new() { Id = 162, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.MajorRenovation), Label = "Major renovation", SortOrder = 3 },
        new() { Id = 163, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.Refurb), Label = "Refurb", SortOrder = 4 },
        new() { Id = 164, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.Remodeling), Label = "Remodeling", SortOrder = 5 },
        new() { Id = 165, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.Commercial), Label = "Commercial", SortOrder = 6 },
        new() { Id = 166, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.Maintenance), Label = "Maintenance", SortOrder = 7 },
        new() { Id = 167, Category = LookupCategories.ProjectType, Value = nameof(ProjectType.Other), Label = "Others", SortOrder = 8 },

        // --- Project status labels (ids 180-199) — Value = nameof(ProjectStatus.X) ---
        new() { Id = 180, Category = LookupCategories.ProjectStatus, Value = nameof(ProjectStatus.New), Label = "New", SortOrder = 1 },
        new() { Id = 181, Category = LookupCategories.ProjectStatus, Value = nameof(ProjectStatus.InProgress), Label = "In Progress", SortOrder = 2 },
        new() { Id = 182, Category = LookupCategories.ProjectStatus, Value = nameof(ProjectStatus.Lost), Label = "Lost", SortOrder = 3 },
        new() { Id = 183, Category = LookupCategories.ProjectStatus, Value = nameof(ProjectStatus.Completed), Label = "Completed", SortOrder = 4 },
        new() { Id = 184, Category = LookupCategories.ProjectStatus, Value = nameof(ProjectStatus.Archived), Label = "Archived", SortOrder = 5 },
        new() { Id = 185, Category = LookupCategories.ProjectStatus, Value = nameof(ProjectStatus.Other), Label = "Others", SortOrder = 6 },
    ];
}
