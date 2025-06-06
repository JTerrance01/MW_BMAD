using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSongCreatorPicksAndWinnerFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsWinner",
                table: "Submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Round1Assignments",
                columns: table => new
                {
                    Round1AssignmentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    VoterId = table.Column<string>(type: "text", nullable: false),
                    VoterGroupNumber = table.Column<int>(type: "integer", nullable: false),
                    AssignedGroupNumber = table.Column<int>(type: "integer", nullable: false),
                    HasVoted = table.Column<bool>(type: "boolean", nullable: false),
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
                name: "SongCreatorPicks",
                columns: table => new
                {
                    SongCreatorPickId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    Comments = table.Column<string>(type: "text", nullable: true),
                    RecordedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongCreatorPicks", x => x.SongCreatorPickId);
                    table.ForeignKey(
                        name: "FK_SongCreatorPicks_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "CompetitionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongCreatorPicks_Submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "Submissions",
                        principalColumn: "SubmissionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SubmissionGroups",
                columns: table => new
                {
                    SubmissionGroupId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    SubmissionId = table.Column<int>(type: "integer", nullable: false),
                    GroupNumber = table.Column<int>(type: "integer", nullable: false),
                    TotalPoints = table.Column<int>(type: "integer", nullable: true),
                    FirstPlaceVotes = table.Column<int>(type: "integer", nullable: true),
                    SecondPlaceVotes = table.Column<int>(type: "integer", nullable: true),
                    RankInGroup = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubmissionGroups", x => x.SubmissionGroupId);
                    table.ForeignKey(
                        name: "FK_SubmissionGroups_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "CompetitionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubmissionGroups_Submissions_SubmissionId",
                        column: x => x.SubmissionId,
                        principalTable: "Submissions",
                        principalColumn: "SubmissionId",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "IX_SongCreatorPicks_CompetitionId_Rank",
                table: "SongCreatorPicks",
                columns: new[] { "CompetitionId", "Rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SongCreatorPicks_SubmissionId",
                table: "SongCreatorPicks",
                column: "SubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionGroups_CompetitionId_GroupNumber",
                table: "SubmissionGroups",
                columns: new[] { "CompetitionId", "GroupNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionGroups_CompetitionId_SubmissionId",
                table: "SubmissionGroups",
                columns: new[] { "CompetitionId", "SubmissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubmissionGroups_SubmissionId",
                table: "SubmissionGroups",
                column: "SubmissionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Round1Assignments");

            migrationBuilder.DropTable(
                name: "SongCreatorPicks");

            migrationBuilder.DropTable(
                name: "SubmissionGroups");

            migrationBuilder.DropColumn(
                name: "IsWinner",
                table: "Submissions");
        }
    }
}
