namespace Construction.Application.Common;

/// <summary>Read-only lookup of user display info, so Application never references Identity.</summary>
public interface IUserDirectory
{
    Task<string?> GetDisplayNameAsync(string userId, CancellationToken cancellationToken);
}
