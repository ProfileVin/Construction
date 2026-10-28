using Construction.Api.Common;
using Construction.Api.Features.Auth;
using Construction.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Onboarding;

[ApiController]
[Route("api/onboarding")]
[Authorize]
public class OnboardingController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpPut("preferences")]
    public async Task<IResult> UpdatePreferencesAsync([FromBody] UpdatePreferencesRequest request)
    {
        var user = await GetUserAsync();
        if (user is null)
        {
            return Results.Unauthorized();
        }

        user.MeasurementSystem = request.MeasurementSystem;
        user.Currency = request.Currency;
        user.TimeZoneId = request.TimeZoneId;
        user.TemperatureUnit = request.TemperatureUnit;
        await userManager.UpdateAsync(user);

        return Results.Ok(UserDto.From(user));
    }

    [HttpPut("company")]
    public async Task<IResult> UpdateCompanyAsync([FromBody] UpdateCompanyRequest request)
    {
        var user = await GetUserAsync();
        if (user is null)
        {
            return Results.Unauthorized();
        }

        user.CompanyDescription = request.CompanyDescription;
        await userManager.UpdateAsync(user);

        return Results.Ok(UserDto.From(user));
    }

    [HttpPost("complete")]
    public async Task<IResult> CompleteAsync([FromBody] CompleteOnboardingRequest request)
    {
        var user = await GetUserAsync();
        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (request.StartMode is not null)
        {
            user.ProjectStartMode = request.StartMode;
        }
        user.OnboardingCompletedAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        return Results.Ok(UserDto.From(user));
    }

    private async Task<ApplicationUser?> GetUserAsync()
    {
        var userId = User.GetUserId();
        return userId is null ? null : await userManager.FindByIdAsync(userId);
    }
}
