using Construction.Application.Documents;
using FluentValidation;

namespace Construction.Api.Features.Documents;

public class UploadDocumentRequestValidator : AbstractValidator<UploadDocumentRequest>
{
    public UploadDocumentRequestValidator()
    {
        RuleFor(x => x.File)
            .NotNull().WithMessage("Choose a file to upload.")
            .Must(f => f is null || f.Length > 0).WithMessage("The file is empty.")
            .Must(f => f is null || f.Length <= DocumentUploadRules.MaxSizeBytes)
            .WithMessage("Files must be 100 MB or smaller.")
            .Must(f => f is null || DocumentUploadRules.IsAllowedExtension(f.FileName))
            .WithMessage("This file type isn't supported.");

        RuleFor(x => x.Name).MaximumLength(260);
    }
}
