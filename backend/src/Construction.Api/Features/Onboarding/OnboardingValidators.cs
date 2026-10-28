using Construction.Api.Features.Reference;
using Construction.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Construction.Api.Features.Onboarding;

public class UpdatePreferencesRequestValidator : AbstractValidator<UpdatePreferencesRequest>
{
    public UpdatePreferencesRequestValidator(AppDbContext db)
    {
        RuleFor(x => x.MeasurementSystem)
            .MustAsync((value, ct) => db.LookupOptions
                .AnyAsync(o => o.Category == LookupCategories.MeasurementSystem && o.Value == value, ct))
            .WithMessage("Choose a supported measurement system.");

        RuleFor(x => x.Currency)
            .MustAsync((value, ct) => db.Currencies.AnyAsync(c => c.Code == value, ct))
            .WithMessage("Choose a supported currency.");

        RuleFor(x => x.TimeZoneId)
            .Must(TimeZoneCatalog.IsValidTimeZone)
            .WithMessage("Choose a supported timezone.");

        RuleFor(x => x.TemperatureUnit)
            .MustAsync((value, ct) => db.LookupOptions
                .AnyAsync(o => o.Category == LookupCategories.TemperatureUnit && o.Value == value, ct))
            .WithMessage("Choose a supported temperature unit.");
    }
}

public class UpdateCompanyRequestValidator : AbstractValidator<UpdateCompanyRequest>
{
    public UpdateCompanyRequestValidator(AppDbContext db)
    {
        RuleFor(x => x.CompanyDescription)
            .MustAsync((value, ct) => db.LookupOptions
                .AnyAsync(o => o.Category == LookupCategories.CompanyDescription && o.Value == value, ct))
            .WithMessage("Choose one of the listed company descriptions.");
    }
}

public class CompleteOnboardingRequestValidator : AbstractValidator<CompleteOnboardingRequest>
{
    public CompleteOnboardingRequestValidator(AppDbContext db)
    {
        RuleFor(x => x.StartMode!)
            .MustAsync((value, ct) => db.LookupOptions
                .AnyAsync(o => o.Category == LookupCategories.StartMode && o.Value == value, ct))
            .When(x => x.StartMode is not null)
            .WithMessage("Start mode must be one of the listed options.");
    }
}
