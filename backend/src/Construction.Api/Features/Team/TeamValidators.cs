using FluentValidation;

namespace Construction.Api.Features.Team;

public class SaveTeamMemberRequestValidator : AbstractValidator<SaveTeamMemberRequest>
{
    public SaveTeamMemberRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Keep the name under 200 characters.");

        RuleFor(x => x.RoleTitle)
            .NotEmpty().WithMessage("Role / trade is required.")
            .MaximumLength(200).WithMessage("Keep the role under 200 characters.");

        RuleFor(x => x.Specialty)
            .MaximumLength(200).WithMessage("Keep the specialty under 200 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Enter a valid email address.")
            .MaximumLength(256).WithMessage("Keep the email under 256 characters.");
    }
}

public class SetTeamMemberStatusRequestValidator : AbstractValidator<SetTeamMemberStatusRequest>
{
    public SetTeamMemberStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}
