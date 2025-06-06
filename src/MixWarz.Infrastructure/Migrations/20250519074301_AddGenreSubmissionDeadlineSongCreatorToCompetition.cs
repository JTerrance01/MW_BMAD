using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGenreSubmissionDeadlineSongCreatorToCompetition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Genre",
                table: "Competitions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SongCreator",
                table: "Competitions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmissionDeadline",
                table: "Competitions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Genre",
                table: "Competitions");

            migrationBuilder.DropColumn(
                name: "SongCreator",
                table: "Competitions");

            migrationBuilder.DropColumn(
                name: "SubmissionDeadline",
                table: "Competitions");
        }
    }
}
