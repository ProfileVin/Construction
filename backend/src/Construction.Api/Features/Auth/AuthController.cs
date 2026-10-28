using Construction.Api.Auth;
using Construction.Api.Common;
using Construction.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    JwtTokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IResult> RegisterAsync([FromBody] RegisterRequest request)
    {
        if (await userManager.FindByEmailAsync(request.Email) is not null)
        {
            return Results.Json(
                new { message = "An account with this email already exists." },
                statusCode: StatusCodes.Status409Conflict);
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            ExcludeFromMarketing = request.ExcludeFromMarketing,
        };

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            var errors = created.Errors
                .GroupBy(_ => "password")
                .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
            return Results.ValidationProblem(errors);
        }

        var roles = await userManager.GetRolesAsync(user);
        var response = tokenService.CreateToken(user, roles);
        return Results.Ok(response);
    }

    [HttpPost("login")]
    public async Task<IResult> LoginAsync([FromBody] LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Results.Json(new { message = "Invalid email or password" }, statusCode: StatusCodes.Status401Unauthorized);
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            var message = result.IsLockedOut
                ? "Account locked. Try again later."
                : "Invalid email or password";
            return Results.Json(new { message }, statusCode: StatusCodes.Status401Unauthorized);
        }

        var roles = await userManager.GetRolesAsync(user);
        var response = tokenService.CreateToken(user, roles);
        return Results.Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IResult> GetMeAsync()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(UserDto.From(user));
    }
}
