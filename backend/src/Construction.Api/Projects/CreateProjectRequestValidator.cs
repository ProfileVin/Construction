using FluentValidation;

namespace Construction.Api.Projects;

public class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Project name is required.")
            .MaximumLength(200).WithMessage("Keep the name under 200 characters.");

        RuleFor(x => x.Type).IsInEnum().WithMessage("Choose a project type.");
        RuleFor(x => x.Status).IsInEnum().WithMessage("Choose a project status.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Keep the description under 2000 characters.");
    }
}
