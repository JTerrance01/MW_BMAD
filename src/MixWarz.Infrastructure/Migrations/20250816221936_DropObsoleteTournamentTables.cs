using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropObsoleteTournamentTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CriteriaScores");

            migrationBuilder.DropTable(
                name: "Round1Assignments");

            migrationBuilder.DropTable(
                name: "SubmissionVotes");

            migrationBuilder.DropTable(
                name: "JudgingCriterias");

            migrationBuilder.DropTable(
                name: "SubmissionJudgments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JudgingCriterias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsCommentRequired = table.Column<bool>(type: "boolean", nullable: false),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    MinScore = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ScoringOptions = table.Column<string>(type: "text", nullable: true),
                    ScoringType = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<decimal>(type: "numeric(5,4)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JudgingCriterias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JudgingCriterias_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "CompetitionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Round1Assignments",
                columns: table => new
                {
                    Round1AssignmentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    VoterId = table.Column<string>(type: "text", nullable: false),
                    AssignedGroupNumber = table.Column<int>(type: "integer", nullable: false),
                    HasVoted = table.Column<bool>(type: "boolean", nullable: false),
                    VoterGroupNumber = table.Column<int>(type: "integer", nullable: false),
                    VotingCompletedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Round1Assignments", x => x.Round1AssignmentId);
                    table.ForeignKey(
                        name: "FK_Round1Assignments_AspNetUsers_VoterId",
                        column: x => x.VoterId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Round1Assignments_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "CompetitionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubmissionJudgments",
                columns: table => new
                {
                    SubmissionJudgmentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    JudgeId = table.Column<string>(type: "text", nullable: false),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    JudgmentTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OverallComments = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OverallScore = table.Column<decimal>(type: "numeric", nullable: true),
                    VotingRound = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubmissionJudgments", x => x.SubmissionJudgmentId);
                    table.ForeignKey(
                        name: "FK_SubmissionJudgments_AspNetUsers_JudgeId",
                        column: x => x.JudgeId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SubmissionJudgments_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "CompetitionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SubmissionJudgments_Submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "Submissions",
                        principalColumn: "SubmissionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubmissionVotes",
                columns: table => new
                {
                    SubmissionVoteId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    VoterId = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: true),
                    VoteTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    VotingRound = table.Column<int>(type: "integer", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "CriteriaScores",
                columns: table => new
                {
                    CriteriaScoreId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    JudgingCriteriaId = table.Column<int>(type: "integer", nullable: false),
                    SubmissionJudgmentId = table.Column<int>(type: "integer", nullable: false),
                    Comments = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Score = table.Column<decimal>(type: "numeric", nullable: false),
                    ScoreTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CriteriaScores", x => x.CriteriaScoreId);
                    table.ForeignKey(
                        name: "FK_CriteriaScores_JudgingCriterias_JudgingCriteriaId",
                        column: x => x.JudgingCriteriaId,
                        principalTable: "JudgingCriterias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CriteriaScores_SubmissionJudgments_SubmissionJudgmentId",
                        column: x => x.SubmissionJudgmentId,
                        principalTable: "SubmissionJudgments",
                        principalColumn: "SubmissionJudgmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CriteriaScores_JudgingCriteriaId",
                table: "CriteriaScores",
                column: "JudgingCriteriaId");

            migrationBuilder.CreateIndex(
                name: "IX_CriteriaScores_SubmissionJudgmentId_JudgingCriteriaId",
                table: "CriteriaScores",
                columns: new[] { "SubmissionJudgmentId", "JudgingCriteriaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JudgingCriterias_CompetitionId_DisplayOrder",
                table: "JudgingCriterias",
                columns: new[] { "CompetitionId", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Round1Assignments_CompetitionId_AssignedGroupNumber",
                table: "Round1Assignments",
                columns: new[] { "CompetitionId", "AssignedGroupNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_Round1Assignments_CompetitionId_VoterId",
                table: "Round1Assignments",
                columns: new[] { "CompetitionId", "VoterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Round1Assignments_VoterId",
                table: "Round1Assignments",
                column: "VoterId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJudgments_CompetitionId_VotingRound",
                table: "SubmissionJudgments",
                columns: new[] { "CompetitionId", "VotingRound" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJudgments_JudgeId",
                table: "SubmissionJudgments",
                column: "JudgeId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionJudgments_SubmissionId_JudgeId_VotingRound",
                table: "SubmissionJudgments",
                columns: new[] { "SubmissionId", "JudgeId", "VotingRound" },
                unique: true);

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
    }
}
