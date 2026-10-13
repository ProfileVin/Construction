using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Construction.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLogNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ActivityLogEntries",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<string>(
                name: "LogNumber",
                table: "ActivityLogEntries",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            // Backfill existing rows with the same per-project sequence new entries get
            // (LOG-{year}-{n:000}, n in occurrence order within the project).
            migrationBuilder.Sql("""
                WITH numbered AS (
                    SELECT LogNumber, OccurredAt,
                           ROW_NUMBER() OVER (PARTITION BY ProjectId ORDER BY OccurredAt, Id) AS Seq
                    FROM ActivityLogEntries
                )
                UPDATE numbered
                SET LogNumber = CONCAT('LOG-', YEAR(OccurredAt), '-', FORMAT(Seq, '000'));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogNumber",
                table: "ActivityLogEntries");

            // Longer descriptions wouldn't fit back into nvarchar(500).
            migrationBuilder.Sql("UPDATE ActivityLogEntries SET Description = LEFT(Description, 500) WHERE LEN(Description) > 500;");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ActivityLogEntries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);
        }
    }
}
