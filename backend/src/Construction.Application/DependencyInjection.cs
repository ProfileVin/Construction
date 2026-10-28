using Construction.Application.Budget;
using Construction.Application.Dashboard;
using Construction.Application.Projects;
using Construction.Application.Schedule;
using Construction.Application.TaskLog;
using Microsoft.Extensions.DependencyInjection;

namespace Construction.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        services.AddScoped<ITaskLogService, TaskLogService>();
        services.AddScoped<IBudgetService, BudgetService>();

        return services;
    }
}
