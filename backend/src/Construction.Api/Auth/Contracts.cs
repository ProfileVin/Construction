using Construction.Infrastructure.Persistence;

namespace Construction.Api.Auth;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string Email,
    string? PhoneNumber,
    string Password,
    bool ExcludeFromMarketing);

public record UserDto(
    string Id,
    string Email,
    string FullName,
    string MeasurementSystem,
    string Currency,
    string TimeZoneId,
    string TemperatureUnit,
    string? CompanyDescription,
    string? ProjectStartMode,
    DateTime? OnboardingCompletedAt)
{
    public static UserDto From(ApplicationUser user) => new(
        user.Id,
        user.Email ?? string.Empty,
        user.FullName,
        user.MeasurementSystem,
        user.Currency,
        user.TimeZoneId,
        user.TemperatureUnit,
        user.CompanyDescription,
        user.ProjectStartMode,
        user.OnboardingCompletedAt);
}

public record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);
