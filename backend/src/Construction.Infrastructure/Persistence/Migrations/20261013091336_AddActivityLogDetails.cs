using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Construction.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLogDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssigneeName",
                table: "ActivityLogEntries",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AttachmentDocumentId",
                table: "ActivityLogEntries",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "ActivityLogEntries",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogEntries_AttachmentDocumentId",
                table: "ActivityLogEntries",
                column: "AttachmentDocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogEntries_ProjectDocuments_AttachmentDocumentId",
                table: "ActivityLogEntries",
                column: "AttachmentDocumentId",
                principalTable: "ProjectDocuments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogEntries_ProjectDocuments_AttachmentDocumentId",
                table: "ActivityLogEntries");

            migrationBuilder.DropIndex(
                name: "IX_ActivityLogEntries_AttachmentDocumentId",
                table: "ActivityLogEntries");

            migrationBuilder.DropColumn(
                name: "AssigneeName",
                table: "ActivityLogEntries");

            migrationBuilder.DropColumn(
                name: "AttachmentDocumentId",
                table: "ActivityLogEntries");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "ActivityLogEntries");
        }
    }
}
