using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <summary>
    /// Migration to add MultitrackZipUrl field to Competition table
    /// </summary>
    public partial class AddMultitrackZipUrlToCompetition : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MultitrackZipUrl",
                table: "Competitions",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MultitrackZipUrl",
                table: "Competitions");
        }
    }
}