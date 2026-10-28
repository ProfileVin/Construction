using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Construction.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConstructionPhasesAndTaskPhaseStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PhaseId",
                table: "ProjectTasks",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ProjectTasks",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Upcoming");

            migrationBuilder.CreateTable(
                name: "ConstructionPhases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PercentComplete = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CheckpointLabel = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConstructionPhases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConstructionPhases_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_PhaseId",
                table: "ProjectTasks",
                column: "PhaseId");

            migrationBuilder.CreateIndex(
                name: "IX_ConstructionPhases_ProjectId",
                table: "ConstructionPhases",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_ConstructionPhases_PhaseId",
                table: "ProjectTasks",
                column: "PhaseId",
                principalTable: "ConstructionPhases",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_ConstructionPhases_PhaseId",
                table: "ProjectTasks");

            migrationBuilder.DropTable(
                name: "ConstructionPhases");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_PhaseId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "PhaseId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ProjectTasks");
        }
    }
}
