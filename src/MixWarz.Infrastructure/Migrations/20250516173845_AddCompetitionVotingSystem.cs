using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompetitionVotingSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Score",
                table: "Submissions",
                newName: "Round2Score");

            migrationBuilder.AddColumn<bool>(
                name: "AdvancedToRound2",
                table: "Submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FinalRank",
                table: "Submissions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FinalScore",
                table: "Submissions",
                type: "numeric(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDisqualified",
                table: "Submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsEligibleForRound1Voting",
                table: "Submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsEligibleForRound2Voting",
                table: "Submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Round1Score",
                table: "Submissions",
                type: "numeric(5,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubmissionVotes",
                columns: table => new
                {
                    SubmissionVoteId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    VoterId = table.Column<string>(type: "text", nullable: false),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: true),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    VotingRound = table.Column<int>(type: "integer", nullable: false),
                    VoteTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubmissionVotes", x => x.SubmissionVoteId);
                    table.ForeignKey(
                        name: "FK_SubmissionVotes_AspNetUsers_VoterId",
                        column: x => x.VoterId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SubmissionVotes_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "CompetitionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SubmissionVotes_Submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "Submissions",
                        principalColumn: "SubmissionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionVotes_CompetitionId_VoterId_VotingRound",
                table: "SubmissionVotes",
                columns: new[] { "CompetitionId", "VoterId", "VotingRound" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionVotes_CompetitionId_VotingRound",
                table: "SubmissionVotes",
                columns: new[] { "CompetitionId", "VotingRound" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionVotes_SubmissionId",
                table: "SubmissionVotes",
                column: "SubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionVotes_VoterId",
                table: "SubmissionVotes",
                column: "VoterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubmissionVotes");

            migrationBuilder.DropColumn(
                name: "AdvancedToRound2",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "FinalRank",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "FinalScore",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "IsDisqualified",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "IsEligibleForRound1Voting",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "IsEligibleForRound2Voting",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "Round1Score",
                table: "Submissions");

            migrationBuilder.RenameColumn(
                name: "Round2Score",
                table: "Submissions",
                newName: "Score");
        }
    }
}
