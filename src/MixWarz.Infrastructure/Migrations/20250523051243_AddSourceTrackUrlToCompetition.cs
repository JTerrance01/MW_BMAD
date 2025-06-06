using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSourceTrackUrlToCompetition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MixedTrackUrl",
                table: "Competitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceTrackUrl",
                table: "Competitions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MixedTrackUrl",
                table: "Competitions");

            migrationBuilder.DropColumn(
                name: "SourceTrackUrl",
                table: "Competitions");
        }
    }
}
