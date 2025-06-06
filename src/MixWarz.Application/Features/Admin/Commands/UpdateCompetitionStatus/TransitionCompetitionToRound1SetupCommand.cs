using MediatR;
using System.Text.Json.Serialization;

namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetitionStatus
{
    public class TransitionCompetitionToRound1SetupCommand : IRequest<TransitionCompetitionToRound1SetupCommandResponse>
    {
        public int CompetitionId { get; set; }

        [JsonConstructor]
        public TransitionCompetitionToRound1SetupCommand(int competitionId)
        {
            CompetitionId = competitionId;
        }
    }

    public class TransitionCompetitionToRound1SetupCommandResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }

        public TransitionCompetitionToRound1SetupCommandResponse(bool success, string message)
        {
            Success = success;
            Message = message;
        }

        public static TransitionCompetitionToRound1SetupCommandResponse SuccessResponse(string message = "Competition has been transitioned to Voting Round 1 Setup")
        {
            return new TransitionCompetitionToRound1SetupCommandResponse(true, message);
        }

        public static TransitionCompetitionToRound1SetupCommandResponse FailureResponse(string message)
        {
            return new TransitionCompetitionToRound1SetupCommandResponse(false, message);
        }
    }
}