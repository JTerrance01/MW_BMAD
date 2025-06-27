using MediatR;
using MixWarz.Domain.Interfaces;
using MixWarz.Domain.Enums;


namespace MixWarz.Application.Features.Admin.Commands.UpdateCompetitionStatus
{
    public class UpdateCompetitionStatusCommandHandler : IRequestHandler<UpdateCompetitionStatusCommand, UpdateCompetitionStatusResponse>
    {
        private readonly ICompetitionRepository _competitionRepository;

        public UpdateCompetitionStatusCommandHandler(ICompetitionRepository competitionRepository)
        {
            _competitionRepository = competitionRepository ?? throw new ArgumentNullException(nameof(competitionRepository));
        }

        public async Task<UpdateCompetitionStatusResponse> Handle(UpdateCompetitionStatusCommand request, CancellationToken cancellationToken)
        {
            Console.WriteLine($"Processing UpdateCompetitionStatusCommand for competition {request.CompetitionId} - new status: {request.NewStatus}");

            // Input validation
            if (request.CompetitionId <= 0)
            {
                return new UpdateCompetitionStatusResponse
                {
                    Success = false,
                    CompetitionId = request.CompetitionId,
                    NewStatus = request.NewStatus,
                    Message = "Invalid competition ID"
                };
            }

            var response = new UpdateCompetitionStatusResponse
            {
                Success = false,
                CompetitionId = request.CompetitionId,
                NewStatus = request.NewStatus,
                Message = "Failed to update competition status"
            };

            // Get the competition
            var competition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
            if (competition == null)
            {
                Console.WriteLine($"Competition not found: {request.CompetitionId}");
                response.Message = "Competition not found";
                return response;
            }

            // Store the old status for the response
            response.OldStatus = competition.Status;
            Console.WriteLine($"Found competition {request.CompetitionId} - '{competition.Title}': Current status: {competition.Status}, Requested status: {request.NewStatus}");

            // Check if status is actually changing
            if (competition.Status == request.NewStatus)
            {
                Console.WriteLine($"Competition {request.CompetitionId} already has status {request.NewStatus}, no update needed");
                response.Success = true;
                response.Message = "Competition already has the requested status";
                return response;
            }

            // Validate that the requested status is a defined enum value
            if (!Enum.IsDefined(typeof(CompetitionStatus), request.NewStatus))
            {
                Console.WriteLine($"Invalid status value requested: {request.NewStatus}");
                response.Success = false;
                response.Message = $"Invalid competition status: {request.NewStatus}";
                return response;
            }

            // Perform the status update
            try
            {
                Console.WriteLine($"Updating competition {request.CompetitionId} status from {competition.Status} to {request.NewStatus}");

                await _competitionRepository.UpdateCompetitionStatusAsync(
                    request.CompetitionId,
                    request.NewStatus,
                    cancellationToken);

                // Verify the update succeeded by retrieving again
                var updatedCompetition = await _competitionRepository.GetByIdAsync(request.CompetitionId);
                if (updatedCompetition != null)
                {
                    Console.WriteLine($"Verification - Competition {request.CompetitionId} status is now: {updatedCompetition.Status}");

                    if (updatedCompetition.Status == request.NewStatus)
                    {
                        response.Success = true;
                        response.Message = "Competition status updated successfully";
                        Console.WriteLine($"Competition {request.CompetitionId} status update CONFIRMED successful");
                    }
                    else
                    {
                        response.Success = false;
                        response.Message = $"Database update appeared to succeed but status remains unchanged: {updatedCompetition.Status}";
                        Console.WriteLine($"WARNING: Competition {request.CompetitionId} status update FAILED verification. Expected: {request.NewStatus}, Actual: {updatedCompetition.Status}");
                    }
                }
                else
                {
                    response.Success = false;
                    response.Message = "Competition not found after status update";
                    Console.WriteLine($"ERROR: Competition {request.CompetitionId} not found during verification");
                }

                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception updating competition status: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                response.Message = $"Error updating competition status: {ex.Message}";
                return response;
            }
        }
    }
}