using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserProductAccessForStripe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GrantDate",
                table: "UserProductAccesses",
                newName: "AccessGrantedDate");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "UserProductAccesses",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "AccessExpiresDate",
                table: "UserProductAccesses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "UserProductAccesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeSubscriptionId",
                table: "UserProductAccesses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccessExpiresDate",
                table: "UserProductAccesses");

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "UserProductAccesses");

            migrationBuilder.DropColumn(
                name: "StripeSubscriptionId",
                table: "UserProductAccesses");

            migrationBuilder.RenameColumn(
                name: "AccessGrantedDate",
                table: "UserProductAccesses",
                newName: "GrantDate");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "UserProductAccesses",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
