using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJudgingSystemEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JudgingCriterias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ScoringType = table.Column<int>(type: "integer", nullable: false),
                    MinScore = table.Column<int>(type: "integer", nullable: false),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<decimal>(type: "numeric(5,4)", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsCommentRequired = table.Column<bool>(type: "boolean", nullable: false),
                    ScoringOptions = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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
                name: "SubmissionJudgments",
                columns: table => new
                {
                    SubmissionJudgmentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    JudgeId = table.Column<string>(type: "text", nullable: false),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    VotingRound = table.Column<int>(type: "integer", nullable: false),
                    OverallScore = table.Column<decimal>(type: "numeric", nullable: true),
                    OverallComments = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    JudgmentTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastUpdated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false)
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
                name: "CriteriaScores",
                columns: table => new
                {
                    CriteriaScoreId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SubmissionJudgmentId = table.Column<int>(type: "integer", nullable: false),
                    JudgingCriteriaId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<decimal>(type: "numeric", nullable: false),
                    Comments = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CriteriaScores");

            migrationBuilder.DropTable(
                name: "JudgingCriterias");

            migrationBuilder.DropTable(
                name: "SubmissionJudgments");
        }
    }
}
