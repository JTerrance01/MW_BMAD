using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;
using MixWarz.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Services
{
    public class Round2VotingService : IRound2VotingService
    {
        private readonly ICompetitionRepository _competitionRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ISubmissionVoteRepository _submissionVoteRepository;
        private readonly ISongCreatorPickRepository _songCreatorPickRepository;

        public Round2VotingService(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            ISubmissionVoteRepository submissionVoteRepository,
            ISongCreatorPickRepository songCreatorPickRepository)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _submissionVoteRepository = submissionVoteRepository;
            _songCreatorPickRepository = songCreatorPickRepository;
        }

        public async Task<int> SetupRound2VotingAsync(int competitionId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            if (competition.Status != CompetitionStatus.VotingRound2Setup)
            {
                throw new Exception($"Competition must be in VotingRound2Setup status, current status: {competition.Status}");
            }

            // Get all submissions that advanced to Round 2
            var advancedSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            advancedSubmissions = advancedSubmissions.Where(s => s.AdvancedToRound2 && !s.IsDisqualified).ToList();

            if (advancedSubmissions.Count() < 3)
            {
                throw new Exception($"Not enough eligible submissions advanced to Round 2. At least 3 required, found {advancedSubmissions.Count()}");
            }

            // Update competition status to VotingRound2Open
            competition.Status = CompetitionStatus.VotingRound2Open;
            await _competitionRepository.UpdateAsync(competition);

            return advancedSubmissions.Count();
        }

        public async Task<IEnumerable<Submission>> GetRound2SubmissionsAsync(int competitionId)
        {
            // Verify competition is in a valid state for Round 2
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            if (competition.Status < CompetitionStatus.VotingRound2Setup)
            {
                throw new Exception($"Competition has not advanced to Round 2 yet, current status: {competition.Status}");
            }

            // Get all submissions that advanced to Round 2
            var submissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            return submissions.Where(s => s.AdvancedToRound2 && !s.IsDisqualified).ToList();
        }

        // Keep this method for backward compatibility
        public async Task<IEnumerable<Submission>> GetAdvancedSubmissionsAsync(int competitionId)
        {
            return await GetRound2SubmissionsAsync(competitionId);
        }

        public async Task<bool> IsUserEligibleForRound2VotingAsync(int competitionId, string userId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null || competition.Status != CompetitionStatus.VotingRound2Open)
            {
                return false;
            }

            // Check if user submitted to the competition
            var userSubmissions = await _submissionRepository.GetByCompetitionIdAndUserIdAsync(competitionId, userId);

            // User must have submitted to the competition
            if (!userSubmissions.Any())
            {
                return false;
            }

            // User's submission must not have advanced to Round 2 (eliminated in Round 1)
            if (userSubmissions.Any(s => s.AdvancedToRound2))
            {
                return false;
            }

            // User's submission must not be disqualified
            if (userSubmissions.Any(s => s.IsDisqualified))
            {
                return false;
            }

            // Check if user has already voted in Round 2
            var hasVoted = await _submissionVoteRepository.HasVoterSubmittedAllVotesAsync(userId, competitionId, 2, 3);
            if (hasVoted)
            {
                return false;
            }

            return true;
        }

        public async Task<bool> RecordRound2VoteAsync(int competitionId, string voterId, int submissionId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null || competition.Status != CompetitionStatus.VotingRound2Open)
            {
                return false;
            }

            // Verify user is eligible to vote
            if (!await IsUserEligibleForRound2VotingAsync(competitionId, voterId))
            {
                return false;
            }

            // Verify submission exists and advanced to Round 2
            var advancedSubmissions = await GetRound2SubmissionsAsync(competitionId);
            if (!advancedSubmissions.Any(s => s.SubmissionId == submissionId))
            {
                return false;
            }

            // Create vote record with proper point value
            var vote = new SubmissionVote
            {
                CompetitionId = competitionId,
                SubmissionId = submissionId,
                VoterId = voterId,
                Rank = 1,
                Points = 1, // Simple vote = 1 point
                VotingRound = 2,
                VoteTime = DateTimeOffset.UtcNow
            };

            // Save vote
            await _submissionVoteRepository.CreateAsync(vote);
            return true;
        }

        // Keep this method for backward compatibility
        public async Task<bool> ProcessRound2VotesAsync(
            int competitionId,
            string userId,
            int firstPlaceSubmissionId,
            int secondPlaceSubmissionId,
            int thirdPlaceSubmissionId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null || competition.Status != CompetitionStatus.VotingRound2Open)
            {
                return false;
            }

            // Verify user is eligible to vote
            if (!await IsUserEligibleForRound2VotingAsync(competitionId, userId))
            {
                return false;
            }

            // Ensure all submission IDs are unique
            var submissionIds = new HashSet<int> { firstPlaceSubmissionId, secondPlaceSubmissionId, thirdPlaceSubmissionId };
            if (submissionIds.Count != 3)
            {
                return false;
            }

            // Verify all voted submissions advanced to Round 2
            var advancedSubmissions = await GetRound2SubmissionsAsync(competitionId);
            var advancedSubmissionIds = advancedSubmissions.Select(s => s.SubmissionId).ToHashSet();

            if (!submissionIds.All(id => advancedSubmissionIds.Contains(id)))
            {
                return false;
            }

            // Create votes records with proper point values
            var votes = new List<SubmissionVote>
            {
                new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = firstPlaceSubmissionId,
                    VoterId = userId,
                    Rank = 1,
                    Points = 3,
                    VotingRound = 2,
                    VoteTime = DateTimeOffset.UtcNow
                },
                new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = secondPlaceSubmissionId,
                    VoterId = userId,
                    Rank = 2,
                    Points = 2,
                    VotingRound = 2,
                    VoteTime = DateTimeOffset.UtcNow
                },
                new SubmissionVote
                {
                    CompetitionId = competitionId,
                    SubmissionId = thirdPlaceSubmissionId,
                    VoterId = userId,
                    Rank = 3,
                    Points = 1,
                    VotingRound = 2,
                    VoteTime = DateTimeOffset.UtcNow
                }
            };

            // Save votes
            foreach (var vote in votes)
            {
                await _submissionVoteRepository.CreateAsync(vote);
            }

            return true;
        }

        public async Task<(int WinnerId, bool IsTie)> TallyRound2VotesAsync(int competitionId)
        {
            // Verify competition exists and is in correct status
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            if (competition.Status != CompetitionStatus.VotingRound2Tallying)
            {
                throw new Exception($"Competition must be in VotingRound2Tallying status, current status: {competition.Status}");
            }

            // Get all advanced submissions
            var advancedSubmissions = await GetRound2SubmissionsAsync(competitionId);

            // Create dictionary to store submission scores
            var submissionScores = new Dictionary<int, (int TotalPoints, int FirstPlaceVotes, int SecondPlaceVotes, int ThirdPlaceVotes)>();

            // Tally votes for each submission
            foreach (var submission in advancedSubmissions)
            {
                // Get all Round 2 votes for this submission
                var votes = await _submissionVoteRepository.GetBySubmissionIdAsync(submission.SubmissionId, 2, 1, 1000);

                int totalPoints = votes.Sum(v => v.Points);
                int firstPlaceVotes = votes.Count(v => v.Rank == 1);
                int secondPlaceVotes = votes.Count(v => v.Rank == 2);
                int thirdPlaceVotes = votes.Count(v => v.Rank == 3);

                // Store scores
                submissionScores[submission.SubmissionId] = (totalPoints, firstPlaceVotes, secondPlaceVotes, thirdPlaceVotes);

                // Update submission with Round 2 score
                submission.Round2Score = totalPoints;

                // Set final score as Round 2 score (could be modified for future scoring systems)
                submission.FinalScore = totalPoints;

                await _submissionRepository.UpdateAsync(submission);
            }

            // Sort submissions by score for ranking
            var rankedSubmissions = submissionScores
                .OrderByDescending(s => s.Value.TotalPoints)
                .ThenByDescending(s => s.Value.FirstPlaceVotes)
                .ThenByDescending(s => s.Value.SecondPlaceVotes)
                .ThenByDescending(s => s.Value.ThirdPlaceVotes)
                .ToList();

            // Determine if there's a clear winner
            var potentialWinners = rankedSubmissions.Count > 0 ?
                rankedSubmissions.Where(s => s.Value.TotalPoints == rankedSubmissions[0].Value.TotalPoints).ToList() :
                new List<KeyValuePair<int, (int TotalPoints, int FirstPlaceVotes, int SecondPlaceVotes, int ThirdPlaceVotes)>>();

            if (potentialWinners.Count == 1)
            {
                // Clear winner by points
                int winnerId = potentialWinners[0].Key;
                return (winnerId, false);
            }
            else if (potentialWinners.Count > 1)
            {
                // Try to break tie with first-place votes
                var winnersWithMostFirstPlaceVotes = potentialWinners
                    .OrderByDescending(w => w.Value.FirstPlaceVotes)
                    .ToList();

                if (winnersWithMostFirstPlaceVotes.Count > 0 &&
                    winnersWithMostFirstPlaceVotes[0].Value.FirstPlaceVotes > winnersWithMostFirstPlaceVotes.Skip(1).FirstOrDefault().Value.FirstPlaceVotes)
                {
                    // Winner determined by first-place votes
                    int winnerId = winnersWithMostFirstPlaceVotes[0].Key;
                    return (winnerId, false);
                }
                else
                {
                    // True tie - requires manual selection
                    return (0, true);
                }
            }

            // No votes or other issue
            return (0, true);
        }

        // Keep this method for backward compatibility
        public async Task<int?> TallyRound2VotesAndDetermineWinnerAsync(int competitionId)
        {
            var (winnerId, isTie) = await TallyRound2VotesAsync(competitionId);
            return isTie ? null : winnerId;
        }

        public async Task<bool> SetCompetitionWinnerAsync(int competitionId, int submissionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                return false;
            }

            // Verify competition is in a valid state for selecting a winner
            if (competition.Status != CompetitionStatus.VotingRound2Tallying &&
                competition.Status != CompetitionStatus.RequiresManualWinnerSelection)
            {
                return false;
            }

            // Verify submission exists and is eligible
            var submission = await _submissionRepository.GetByIdAsync(submissionId);
            if (submission == null || submission.CompetitionId != competitionId ||
                !submission.AdvancedToRound2 || submission.IsDisqualified)
            {
                return false;
            }

            // Get all submissions for the competition to update rankings
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);

            // Mark the winner
            submission.IsWinner = true;
            submission.FinalRank = 1;
            await _submissionRepository.UpdateAsync(submission);

            // Mark all other submissions as not winners and update their final rank if needed
            foreach (var other in allSubmissions.Where(s => s.SubmissionId != submissionId))
            {
                if (other.IsWinner)
                {
                    other.IsWinner = false;
                    await _submissionRepository.UpdateAsync(other);
                }
            }

            // Update competition status
            competition.Status = CompetitionStatus.Completed;
            await _competitionRepository.UpdateAsync(competition);

            return true;
        }

        // Keep for backward compatibility
        public async Task<bool> SelectWinnerManuallyAsync(int competitionId, int winningSubmissionId)
        {
            return await SetCompetitionWinnerAsync(competitionId, winningSubmissionId);
        }

        public async Task<int> RecordSongCreatorPicksAsync(int competitionId, List<int> submissionIds)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            // Verify competition is in a valid state
            if (competition.Status < CompetitionStatus.VotingRound2Setup)
            {
                throw new Exception($"Competition must be at least in Round 2 setup, current status: {competition.Status}");
            }

            // Verify submissions exist and are eligible
            var eligibleSubmissions = await GetRound2SubmissionsAsync(competitionId);
            var eligibleIds = eligibleSubmissions.Select(s => s.SubmissionId).ToHashSet();

            if (!submissionIds.All(id => eligibleIds.Contains(id)))
            {
                throw new Exception("One or more selected submissions are not eligible for Round 2");
            }

            // Check if there are existing picks and delete them
            if (await _songCreatorPickRepository.ExistsForCompetitionAsync(competitionId))
            {
                await _songCreatorPickRepository.DeleteByCompetitionIdAsync(competitionId);
            }

            // Create new picks
            var picks = new List<SongCreatorPick>();
            for (int i = 0; i < Math.Min(submissionIds.Count, 3); i++)
            {
                var pick = new SongCreatorPick
                {
                    CompetitionId = competitionId,
                    SubmissionId = submissionIds[i],
                    Rank = i + 1,
                    Comment = $"Song creator pick #{i + 1}",
                    CreatedAt = DateTime.UtcNow
                };

                await _songCreatorPickRepository.CreateAsync(pick);
                picks.Add(pick);
            }

            return picks.Count;
        }

        // Keep for backward compatibility 
        public async Task<bool> RecordSongCreatorPicksAsync(
            int competitionId,
            int firstPlaceSubmissionId,
            int secondPlaceSubmissionId,
            int thirdPlaceSubmissionId)
        {
            var submissionIds = new List<int> { firstPlaceSubmissionId, secondPlaceSubmissionId, thirdPlaceSubmissionId };
            int count = await RecordSongCreatorPicksAsync(competitionId, submissionIds);
            return count == 3;
        }

        public async Task<bool> HasSongCreatorPicksAsync(int competitionId)
        {
            return await _songCreatorPickRepository.ExistsForCompetitionAsync(competitionId);
        }

        public async Task<int> GetRound2VoterCountAsync(int competitionId)
        {
            var votes = await _submissionVoteRepository.GetByCompetitionIdAsync(competitionId, 2, 1, 1000);
            return votes.Select(v => v.VoterId).Distinct().Count();
        }

        public async Task<int> GetCompletedRound2VotesCountAsync(int competitionId)
        {
            var votes = await _submissionVoteRepository.GetByCompetitionIdAsync(competitionId, 2, 1, 1000);
            return votes.Count();
        }

        public async Task<List<object>> GetPreliminaryRound2RankingsAsync(int competitionId)
        {
            var submissions = await GetRound2SubmissionsAsync(competitionId);
            var result = new List<object>();

            foreach (var submission in submissions)
            {
                var votes = await _submissionVoteRepository.GetBySubmissionIdAsync(submission.SubmissionId, 2, 1, 1000);
                int totalPoints = votes.Sum(v => v.Points);
                int voteCount = votes.Count();

                result.Add(new
                {
                    SubmissionId = submission.SubmissionId,
                    Title = submission.MixTitle,
                    SubmitterId = submission.UserId,
                    TotalPoints = totalPoints,
                    VoteCount = voteCount
                });
            }

            return result.OrderByDescending(r => ((dynamic)r).TotalPoints).ToList();
        }

        public async Task<CompetitionResults> GetCompetitionResultsAsync(int competitionId)
        {
            // Verify competition exists
            var competition = await _competitionRepository.GetByIdAsync(competitionId);
            if (competition == null)
            {
                throw new Exception($"Competition with ID {competitionId} not found");
            }

            // Verify competition is completed or in final phases
            if (competition.Status < CompetitionStatus.VotingRound2Tallying)
            {
                throw new Exception($"Competition must be at least in Round 2 tallying phase, current status: {competition.Status}");
            }

            // Get winner if exists
            var winner = (await _submissionRepository.GetByCompetitionIdAsync(competitionId))
                .FirstOrDefault(s => s.IsWinner);

            // Get all Round 2 submissions
            var round2Submissions = await GetRound2SubmissionsAsync(competitionId);

            // Get votes for each submission
            var results = new List<SubmissionResult>();
            foreach (var submission in round2Submissions)
            {
                var votes = await _submissionVoteRepository.GetBySubmissionIdAsync(submission.SubmissionId, 2, 1, 1000);

                results.Add(new SubmissionResult
                {
                    SubmissionId = submission.SubmissionId,
                    MixTitle = submission.MixTitle,
                    SubmitterName = submission.User?.UserName ?? "Unknown",
                    VoteCount = votes.Count(),
                    IsWinner = submission.IsWinner
                });
            }

            // Get song creator picks
            var creatorPicks = await _songCreatorPickRepository.GetByCompetitionIdAsync(competitionId);

            // Prepare result object
            var competitionResults = new CompetitionResults
            {
                CompetitionId = competitionId,
                CompetitionTitle = competition.Title,
                WinningSubmissionId = winner?.SubmissionId,
                WinnerName = winner?.User?.UserName ?? "Unknown",
                WinningMixTitle = winner?.MixTitle ?? "Unknown",
                TotalVotes = await GetCompletedRound2VotesCountAsync(competitionId),
                Round2Results = results.OrderByDescending(r => r.VoteCount).ToList(),
                SongCreatorPicks = creatorPicks.ToList()
            };

            return competitionResults;
        }
    }
}