using Construction.Application.Common;
using Construction.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;

namespace Construction.Infrastructure.Identity;

public class UserDirectory(UserManager<ApplicationUser> userManager) : IUserDirectory
{
    public async Task<string?> GetDisplayNameAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return null;
        }

        return string.IsNullOrWhiteSpace(user.FullName) ? user.Email : user.FullName;
    }
}
