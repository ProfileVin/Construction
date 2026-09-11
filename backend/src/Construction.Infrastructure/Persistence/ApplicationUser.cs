using Microsoft.AspNetCore.Identity;

namespace Construction.Infrastructure.Persistence;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;

    /// <summary>User opted out of product-update and marketing email.</summary>
    public bool ExcludeFromMarketing { get; set; }

    // --- Onboarding / workspace preferences (FEAT-006) ---
    public string MeasurementSystem { get; set; } = "Metric";
    public string Currency { get; set; } = "USD";
    public string TimeZoneId { get; set; } = "UTC";
    public string TemperatureUnit { get; set; } = "Celsius";

    /// <summary>"Builder" / "Remodeler" / "ConstructionManager" / "Other" — onboarding company step.</summary>
    public string? CompanyDescription { get; set; }

    /// <summary>"Scratch" or "Template" — how the user chose to start (onboarding step 2).</summary>
    public string? ProjectStartMode { get; set; }

    /// <summary>Set when the user finishes the onboarding wizard. Null = not completed.</summary>
    public DateTime? OnboardingCompletedAt { get; set; }
}
