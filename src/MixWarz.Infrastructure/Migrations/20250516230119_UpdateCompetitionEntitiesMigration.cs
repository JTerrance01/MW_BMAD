using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCompetitionEntitiesMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Comments",
                table: "SongCreatorPicks");

            migrationBuilder.RenameColumn(
                name: "RecordedDate",
                table: "SongCreatorPicks",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "SongCreatorPickId",
                table: "SongCreatorPicks",
                newName: "PickId");

            migrationBuilder.AddColumn<string>(
                name: "Comment",
                table: "SongCreatorPicks",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Comment",
                table: "SongCreatorPicks");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "SongCreatorPicks",
                newName: "RecordedDate");

            migrationBuilder.RenameColumn(
                name: "PickId",
                table: "SongCreatorPicks",
                newName: "SongCreatorPickId");

            migrationBuilder.AddColumn<string>(
                name: "Comments",
                table: "SongCreatorPicks",
                type: "text",
                nullable: true);
        }
    }
}
