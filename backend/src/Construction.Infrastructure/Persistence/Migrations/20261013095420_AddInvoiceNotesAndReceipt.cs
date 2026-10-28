using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Construction.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceNotesAndReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Invoices",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReceiptDocumentId",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ReceiptDocumentId",
                table: "Invoices",
                column: "ReceiptDocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_ProjectDocuments_ReceiptDocumentId",
                table: "Invoices",
                column: "ReceiptDocumentId",
                principalTable: "ProjectDocuments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_ProjectDocuments_ReceiptDocumentId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_ReceiptDocumentId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ReceiptDocumentId",
                table: "Invoices");
        }
    }
}
