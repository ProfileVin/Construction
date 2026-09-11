namespace Construction.Api.Onboarding;

public record UpdatePreferencesRequest(
    string MeasurementSystem,
    string Currency,
    string TimeZoneId,
    string TemperatureUnit);

public record UpdateCompanyRequest(string CompanyDescription);

public record CompleteOnboardingRequest(string? StartMode);
