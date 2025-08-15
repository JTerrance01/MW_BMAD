using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialHybridTournamentModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "JudgingProwessScore",
                table: "AspNetUsers",
                type: "numeric",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Judgements",
                columns: table => new
                {
                    JudgementId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    JudgeUserId = table.Column<string>(type: "text", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Feedback = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Judgements", x => x.JudgementId);
                    table.ForeignKey(
                        name: "FK_Judgements_AspNetUsers_JudgeUserId",
                        column: x => x.JudgeUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Judgements_Submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "Submissions",
                        principalColumn: "SubmissionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FeedbackRatings",
                columns: table => new
                {
                    FeedbackRatingId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JudgementId = table.Column<int>(type: "integer", nullable: false),
                    RaterUserId = table.Column<string>(type: "text", nullable: false),
                    IsHelpful = table.Column<bool>(type: "boolean", nullable: false),
                    RatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackRatings", x => x.FeedbackRatingId);
                    table.ForeignKey(
                        name: "FK_FeedbackRatings_AspNetUsers_RaterUserId",
                        column: x => x.RaterUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FeedbackRatings_Judgements_JudgementId",
                        column: x => x.JudgementId,
                        principalTable: "Judgements",
                        principalColumn: "JudgementId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackRatings_JudgementId_RaterUserId",
                table: "FeedbackRatings",
                columns: new[] { "JudgementId", "RaterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackRatings_RaterUserId",
                table: "FeedbackRatings",
                column: "RaterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Judgements_JudgeUserId",
                table: "Judgements",
                column: "JudgeUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Judgements_SubmissionId_JudgeUserId",
                table: "Judgements",
                columns: new[] { "SubmissionId", "JudgeUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeedbackRatings");

            migrationBuilder.DropTable(
                name: "Judgements");

            migrationBuilder.DropColumn(
                name: "JudgingProwessScore",
                table: "AspNetUsers");
        }
    }
}
