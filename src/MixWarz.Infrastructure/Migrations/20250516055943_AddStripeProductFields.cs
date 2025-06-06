using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStripeProductFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileUrl",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GenreId",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SampleAudioUrl",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "StripePriceId",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeProductId",
                table: "Products",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "GenreId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "SampleAudioUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StripePriceId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StripeProductId",
                table: "Products");
        }
    }
}
