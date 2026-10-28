using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Construction.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChangeOrderDetailsAndTwoStepApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The old free-text Reason becomes Scope (data kept); Reason is now a short dropdown value.
            migrationBuilder.RenameColumn(
                name: "Reason",
                table: "ChangeOrders",
                newName: "Scope");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "ChangeOrders",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "ChangeOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ContractorReviewedAt",
                table: "ChangeOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractorReviewedByName",
                table: "ChangeOrders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerDecidedByName",
                table: "ChangeOrders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedByName",
                table: "ChangeOrders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ScheduleImpactDays",
                table: "ChangeOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ChangeOrderAttachments",
                columns: table => new
                {
                    ChangeOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChangeOrderAttachments", x => new { x.ChangeOrderId, x.DocumentId });
                    table.ForeignKey(
                        name: "FK_ChangeOrderAttachments_ChangeOrders_ChangeOrderId",
                        column: x => x.ChangeOrderId,
                        principalTable: "ChangeOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChangeOrderAttachments_ProjectDocuments_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "ProjectDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChangeOrders_CategoryId",
                table: "ChangeOrders",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ChangeOrderAttachments_DocumentId",
                table: "ChangeOrderAttachments",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChangeOrders_BudgetCategories_CategoryId",
                table: "ChangeOrders",
                column: "CategoryId",
                principalTable: "BudgetCategories",
                principalColumn: "Id");

            // Rows decided under the old single-step flow count as decided at the GC review step too.
            migrationBuilder.Sql(
                "UPDATE ChangeOrders SET ContractorReviewedAt = DecidedAt " +
                "WHERE Status IN ('Approved', 'Rejected') AND ContractorReviewedAt IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChangeOrders_BudgetCategories_CategoryId",
                table: "ChangeOrders");

            migrationBuilder.DropTable(
                name: "ChangeOrderAttachments");

            migrationBuilder.DropIndex(
                name: "IX_ChangeOrders_CategoryId",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "ContractorReviewedAt",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "ContractorReviewedByName",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "OwnerDecidedByName",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "RequestedByName",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "ScheduleImpactDays",
                table: "ChangeOrders");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "ChangeOrders");

            migrationBuilder.RenameColumn(
                name: "Scope",
                table: "ChangeOrders",
                newName: "Reason");
        }
    }
}
