namespace Construction.Application.Dashboard;

public record CreateProjectTaskCommand(
    string Title,
    string AssigneeName,
    DateOnly AssignedDate,
    DateOnly Deadline);
