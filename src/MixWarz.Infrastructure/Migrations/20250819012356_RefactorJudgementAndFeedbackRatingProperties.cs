using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MixWarz.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorJudgementAndFeedbackRatingProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FeedbackRatings_AspNetUsers_RaterUserId",
                table: "FeedbackRatings");

            migrationBuilder.DropForeignKey(
                name: "FK_Judgements_AspNetUsers_JudgeUserId",
                table: "Judgements");

            migrationBuilder.DropColumn(
                name: "IsHelpful",
                table: "FeedbackRatings");

            migrationBuilder.RenameColumn(
                name: "JudgeUserId",
                table: "Judgements",
                newName: "JudgeId");

            migrationBuilder.RenameColumn(
                name: "Feedback",
                table: "Judgements",
                newName: "Comments");

            migrationBuilder.RenameIndex(
                name: "IX_Judgements_SubmissionId_JudgeUserId",
                table: "Judgements",
                newName: "IX_Judgements_SubmissionId_JudgeId");

            migrationBuilder.RenameIndex(
                name: "IX_Judgements_JudgeUserId",
                table: "Judgements",
                newName: "IX_Judgements_JudgeId");

            migrationBuilder.RenameColumn(
                name: "RaterUserId",
                table: "FeedbackRatings",
                newName: "ParticipantId");

            migrationBuilder.RenameIndex(
                name: "IX_FeedbackRatings_RaterUserId",
                table: "FeedbackRatings",
                newName: "IX_FeedbackRatings_ParticipantId");

            migrationBuilder.RenameIndex(
                name: "IX_FeedbackRatings_JudgementId_RaterUserId",
                table: "FeedbackRatings",
                newName: "IX_FeedbackRatings_JudgementId_ParticipantId");

            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "FeedbackRatings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_FeedbackRatings_AspNetUsers_ParticipantId",
                table: "FeedbackRatings",
                column: "ParticipantId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Judgements_AspNetUsers_JudgeId",
                table: "Judgements",
                column: "JudgeId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FeedbackRatings_AspNetUsers_ParticipantId",
                table: "FeedbackRatings");

            migrationBuilder.DropForeignKey(
                name: "FK_Judgements_AspNetUsers_JudgeId",
                table: "Judgements");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "FeedbackRatings");

            migrationBuilder.RenameColumn(
                name: "JudgeId",
                table: "Judgements",
                newName: "JudgeUserId");

            migrationBuilder.RenameColumn(
                name: "Comments",
                table: "Judgements",
                newName: "Feedback");

            migrationBuilder.RenameIndex(
                name: "IX_Judgements_SubmissionId_JudgeId",
                table: "Judgements",
                newName: "IX_Judgements_SubmissionId_JudgeUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Judgements_JudgeId",
                table: "Judgements",
                newName: "IX_Judgements_JudgeUserId");

            migrationBuilder.RenameColumn(
                name: "ParticipantId",
                table: "FeedbackRatings",
                newName: "RaterUserId");

            migrationBuilder.RenameIndex(
                name: "IX_FeedbackRatings_ParticipantId",
                table: "FeedbackRatings",
                newName: "IX_FeedbackRatings_RaterUserId");

            migrationBuilder.RenameIndex(
                name: "IX_FeedbackRatings_JudgementId_ParticipantId",
                table: "FeedbackRatings",
                newName: "IX_FeedbackRatings_JudgementId_RaterUserId");

            migrationBuilder.AddColumn<bool>(
                name: "IsHelpful",
                table: "FeedbackRatings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_FeedbackRatings_AspNetUsers_RaterUserId",
                table: "FeedbackRatings",
                column: "RaterUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Judgements_AspNetUsers_JudgeUserId",
                table: "Judgements",
                column: "JudgeUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
