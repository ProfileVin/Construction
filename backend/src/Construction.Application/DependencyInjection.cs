using Construction.Application.Budget;
using Construction.Application.ChangeOrders;
using Construction.Application.Dashboard;
using Construction.Application.Documents;
using Construction.Application.Payments;
using Construction.Application.Projects;
using Construction.Application.PurchaseOrders;
using Construction.Application.Schedule;
using Construction.Application.TaskLog;
using Construction.Application.Team;
using Microsoft.Extensions.DependencyInjection;

namespace Construction.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<AttachmentUploader>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        services.AddScoped<ITaskLogService, TaskLogService>();
        services.AddScoped<IBudgetService, BudgetService>();
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        services.AddScoped<IChangeOrderService, ChangeOrderService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<ITeamService, TeamService>();

        return services;
    }
}
