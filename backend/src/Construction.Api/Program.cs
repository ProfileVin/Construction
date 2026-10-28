using System.Text;
using System.Text.Json.Serialization;
using Construction.Api.Auth;
using Construction.Api.Common;
using Construction.Api.Features.Auth;
using Construction.Application;
using Construction.Infrastructure;
using Construction.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day));

    var services = builder.Services;
    var config = builder.Configuration;

    const string SpaCorsPolicy = "spa";
    services.AddCors(options => options.AddPolicy(SpaCorsPolicy, policy => policy
        .WithOrigins("http://localhost:5173", "http://localhost:5174")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    services.AddInfrastructure(config);
    services.AddApplication();

    services.ConfigureHttpJsonOptions(options =>
        options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

    services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireDigit = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddRoles<IdentityRole>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddSignInManager();

    var jwtSection = config.GetSection(JwtOptions.SectionName);
    services.Configure<JwtOptions>(jwtSection);
    var jwtOptions = jwtSection.Get<JwtOptions>()
        ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");

    services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
                ClockSkew = TimeSpan.FromSeconds(30),
            };
        });

    services.AddAuthorization();

    services.AddScoped<JwtTokenService>();
    services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

    services.AddHealthChecks().AddDbContextCheck<AppDbContext>();
    services.AddOpenApi();

    services.AddControllers(options => options.Filters.Add<FluentValidationFilter>())
        .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

    var app = builder.Build();

    app.UseSerilogRequestLogging();
    app.UseCors(SpaCorsPolicy);
    app.UseAuthentication();
    app.UseAuthorization();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference();
    }

    app.MapHealthChecks("/health");
    app.MapControllers();

    if (app.Environment.IsDevelopment())
    {
        ////await DbSeeder.SeedAsync(app.Services);
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
