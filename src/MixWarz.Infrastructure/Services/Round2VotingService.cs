using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<Round2VotingService> _logger;

        public Round2VotingService(
            ICompetitionRepository competitionRepository,
            ISubmissionRepository submissionRepository,
            ISubmissionVoteRepository submissionVoteRepository,
            ISongCreatorPickRepository songCreatorPickRepository,
            ILogger<Round2VotingService> logger)
        {
            _competitionRepository = competitionRepository;
            _submissionRepository = submissionRepository;
            _submissionVoteRepository = submissionVoteRepository;
            _songCreatorPickRepository = songCreatorPickRepository;
            _logger = logger;
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

            // UPDATED BUSINESS LOGIC: User's submission must not be disqualified
            // All non-disqualified competitors can vote in Round 2 (regardless of advancement)
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

        // REMOVED: RecordRound2VoteAsync method was incorrect (always recorded Rank=1, Points=1)
        // Use ProcessRound2VotesAsync instead for proper 1st=3pts, 2nd=2pts, 3rd=1pt business logic

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

            // Create dictionary to store submission scores and details
            var submissionData = new Dictionary<int, (
                int TotalPoints,
                int FirstPlaceVotes,
                int SecondPlaceVotes,
                int ThirdPlaceVotes,
                decimal Round1Score,
                decimal CombinedScore,
                Submission Submission)>();

            // Tally votes for each submission
            foreach (var submission in advancedSubmissions)
            {
                // Get all Round 2 votes for this submission
                var votes = await _submissionVoteRepository.GetBySubmissionIdAsync(submission.SubmissionId, 2, 1, 1000);

                int totalPoints = votes.Sum(v => v.Points);
                int firstPlaceVotes = votes.Count(v => v.Rank == 1);
                int secondPlaceVotes = votes.Count(v => v.Rank == 2);
                int thirdPlaceVotes = votes.Count(v => v.Rank == 3);

                // Get Round 1 score (use 0 if null)
                decimal round1Score = submission.Round1Score ?? 0;

                // Calculate combined score (Round1Score + Round2Score)
                decimal round2Score = totalPoints;
                decimal combinedScore = round1Score + round2Score;

                // Store submission data
                submissionData[submission.SubmissionId] = (
                    totalPoints,
                    firstPlaceVotes,
                    secondPlaceVotes,
                    thirdPlaceVotes,
                    round1Score,
                    combinedScore,
                    submission);

                // Update submission with Round 2 score and combined final score
                submission.Round2Score = round2Score;
                submission.FinalScore = combinedScore;

                await _submissionRepository.UpdateAsync(submission);

                _logger.LogInformation($"Round 2 Tally - Submission {submission.SubmissionId}: " +
                    $"Round1Score={round1Score}, Round2Score={round2Score}, FinalScore={combinedScore}, " +
                    $"1st={firstPlaceVotes}, 2nd={secondPlaceVotes}, 3rd={thirdPlaceVotes}");
            }

            // Sort submissions by Round 2 score first (primary ranking)
            var rankedByRound2 = submissionData
                .OrderByDescending(s => s.Value.TotalPoints)
                .ThenByDescending(s => s.Value.FirstPlaceVotes)
                .ThenByDescending(s => s.Value.SecondPlaceVotes)
                .ThenByDescending(s => s.Value.ThirdPlaceVotes)
                .ToList();

            // Check for Round 2 ties at the top
            var topRound2Score = rankedByRound2.FirstOrDefault().Value.TotalPoints;
            var round2Tied = rankedByRound2.Where(s => s.Value.TotalPoints == topRound2Score).ToList();

            if (round2Tied.Count == 1)
            {
                // Clear winner by Round 2 points alone
                int winnerId = round2Tied[0].Key;
                var winner = round2Tied[0].Value.Submission;
                winner.IsWinner = true;
                winner.FinalRank = 1;
                await _submissionRepository.UpdateAsync(winner);

                // IMPORTANT: Assign final rankings to ALL Round 2 competitors
                await AssignFinalRankingsToAllCompetitors(submissionData, competitionId);

                // Mark competition as completed and set completion date
                competition.Status = CompetitionStatus.Completed;
                competition.CompletedDate = DateTime.UtcNow;
                await _competitionRepository.UpdateAsync(competition);

                _logger.LogInformation($"Competition {competitionId} winner determined by Round 2 score: " +
                    $"Submission {winnerId} with {topRound2Score} points");

                // Validate rankings
                await ValidateRound2RankingsAsync(competitionId);

                return (winnerId, false);
            }
            else if (round2Tied.Count > 1)
            {
                _logger.LogInformation($"Competition {competitionId} has Round 2 tie with {round2Tied.Count} submissions " +
                    $"at {topRound2Score} points. Using combined score tie-breaking...");

                // Round 2 tie detected - use combined score (Round1 + Round2) for tie-breaking
                var tieBreakRanked = round2Tied
                    .OrderByDescending(s => s.Value.CombinedScore)
                    .ThenByDescending(s => s.Value.FirstPlaceVotes)
                    .ThenByDescending(s => s.Value.SecondPlaceVotes)
                    .ThenByDescending(s => s.Value.ThirdPlaceVotes)
                    .ToList();

                var topCombinedScore = tieBreakRanked[0].Value.CombinedScore;
                var combinedScoreTied = tieBreakRanked.Where(s => s.Value.CombinedScore == topCombinedScore).ToList();

                if (combinedScoreTied.Count == 1)
                {
                    // Tie broken by combined score
                    int winnerId = combinedScoreTied[0].Key;
                    var winner = combinedScoreTied[0].Value.Submission;
                    winner.IsWinner = true;
                    winner.FinalRank = 1;
                    await _submissionRepository.UpdateAsync(winner);

                    // IMPORTANT: Assign final rankings to ALL Round 2 competitors
                    await AssignFinalRankingsToAllCompetitors(submissionData, competitionId);

                    // Mark competition as completed and set completion date
                    competition.Status = CompetitionStatus.Completed;
                    competition.CompletedDate = DateTime.UtcNow;
                    await _competitionRepository.UpdateAsync(competition);

                    _logger.LogInformation($"Competition {competitionId} tie broken by combined score: " +
                        $"Submission {winnerId} with combined score {topCombinedScore} " +
                        $"(Round1: {combinedScoreTied[0].Value.Round1Score}, Round2: {combinedScoreTied[0].Value.TotalPoints})");

                    // Validate rankings
                    await ValidateRound2RankingsAsync(competitionId);

                    return (winnerId, false);
                }
                else
                {
                    // Still tied even after combined score - try first-place votes
                    var firstPlaceWinners = combinedScoreTied
                        .OrderByDescending(s => s.Value.FirstPlaceVotes)
                        .ToList();

                    if (firstPlaceWinners.Count > 0 &&
                        firstPlaceWinners[0].Value.FirstPlaceVotes >
                        firstPlaceWinners.Skip(1).FirstOrDefault().Value.FirstPlaceVotes)
                    {
                        // Tie broken by first-place votes
                        int winnerId = firstPlaceWinners[0].Key;
                        var winner = firstPlaceWinners[0].Value.Submission;
                        winner.IsWinner = true;
                        winner.FinalRank = 1;
                        await _submissionRepository.UpdateAsync(winner);

                        // IMPORTANT: Assign final rankings to ALL Round 2 competitors
                        await AssignFinalRankingsToAllCompetitors(submissionData, competitionId);

                        // Mark competition as completed and set completion date
                        competition.Status = CompetitionStatus.Completed;
                        competition.CompletedDate = DateTime.UtcNow;
                        await _competitionRepository.UpdateAsync(competition);

                        _logger.LogInformation($"Competition {competitionId} tie broken by first-place votes: " +
                            $"Submission {winnerId} with {firstPlaceWinners[0].Value.FirstPlaceVotes} first-place votes");

                        // Validate rankings
                        await ValidateRound2RankingsAsync(competitionId);

                        return (winnerId, false);
                    }
                    else
                    {
                        // True tie - requires manual selection
                        _logger.LogWarning($"Competition {competitionId} has unresolvable tie between submissions: " +
                            string.Join(", ", combinedScoreTied.Select(s => $"{s.Key} (Combined: {s.Value.CombinedScore})")));

                        return (0, true);
                    }
                }
            }

            // No votes or other issue
            _logger.LogWarning($"Competition {competitionId} has no valid Round 2 submissions or votes");
            return (0, true);
        }

        /// <summary>
        /// Validates that all Round 2 competitors have been assigned a FinalRank
        /// </summary>
        private async Task ValidateRound2RankingsAsync(int competitionId)
        {
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            var round2Submissions = allSubmissions.Where(s => s.AdvancedToRound2).ToList();

            var missingRanks = round2Submissions.Where(s => !s.FinalRank.HasValue).ToList();

            if (missingRanks.Any())
            {
                _logger.LogError($"❌ VALIDATION ERROR: {missingRanks.Count} Round 2 competitors are missing FinalRank!");
                foreach (var submission in missingRanks)
                {
                    _logger.LogError($"   - Submission {submission.SubmissionId} ({submission.MixTitle}) has NULL FinalRank");
                }

                // In production, you might want to throw an exception
                // throw new Exception($"Round 2 ranking validation failed: {missingRanks.Count} competitors missing FinalRank");
            }
            else
            {
                _logger.LogInformation($"✅ Round 2 ranking validation passed: All {round2Submissions.Count} competitors have FinalRank assigned");
            }

            // Log ranking distribution
            var rankGroups = allSubmissions
                .Where(s => s.FinalRank.HasValue)
                .GroupBy(s => s.FinalRank.Value)
                .OrderBy(g => g.Key);

            _logger.LogInformation($"📊 Final Ranking Distribution for Competition {competitionId}:");
            foreach (var group in rankGroups)
            {
                if (group.Count() > 1)
                {
                    _logger.LogWarning($"   Rank {group.Key}: {group.Count()} submissions (DUPLICATE RANK!)");
                }
                else
                {
                    _logger.LogInformation($"   Rank {group.Key}: {group.First().MixTitle}");
                }
            }
        }

        /// <summary>
        /// Assign final rankings to ALL Round 2 competitors based on their scores
        /// This should be called in ALL cases, not just tie scenarios
        /// </summary>
        private async Task AssignFinalRankingsToAllCompetitors(
            Dictionary<int, (int TotalPoints, int FirstPlaceVotes, int SecondPlaceVotes, int ThirdPlaceVotes, decimal Round1Score, decimal CombinedScore, Submission Submission)> submissionData,
            int competitionId)
        {
            // Get all submissions for the competition
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);

            // Rank all Round 2 competitors by their combined score (Round1 + Round2)
            var round2Competitors = submissionData
                .OrderByDescending(s => s.Value.CombinedScore)
                .ThenByDescending(s => s.Value.TotalPoints)  // Round2 score as tie-breaker
                .ThenByDescending(s => s.Value.FirstPlaceVotes)
                .ThenByDescending(s => s.Value.SecondPlaceVotes)
                .ThenByDescending(s => s.Value.ThirdPlaceVotes)
                .ThenBy(s => s.Key) // Submission ID as final tie-breaker for consistency
                .ToList();

            // Assign final ranks to all Round 2 competitors
            for (int i = 0; i < round2Competitors.Count; i++)
            {
                var submission = round2Competitors[i].Value.Submission;

                // Skip if already set (e.g., winner already has rank 1)
                if (submission.FinalRank.HasValue && submission.FinalRank.Value == 1 && submission.IsWinner)
                {
                    _logger.LogInformation($"Final Ranking - Position {i + 1}: Submission {submission.SubmissionId} (WINNER) " +
                        $"(Combined Score: {round2Competitors[i].Value.CombinedScore}, " +
                        $"Round2: {round2Competitors[i].Value.TotalPoints}, " +
                        $"Round1: {round2Competitors[i].Value.Round1Score})");
                    continue;
                }

                submission.FinalRank = i + 1;
                await _submissionRepository.UpdateAsync(submission);

                _logger.LogInformation($"Final Ranking - Position {i + 1}: Submission {submission.SubmissionId} " +
                    $"(Combined Score: {round2Competitors[i].Value.CombinedScore}, " +
                    $"Round2: {round2Competitors[i].Value.TotalPoints}, " +
                    $"Round1: {round2Competitors[i].Value.Round1Score})");
            }

            // Get Round 2 competitor IDs
            var round2CompetitorIds = submissionData.Keys.ToHashSet();

            // Assign ranks to non-Round2 submissions (those who didn't advance)
            var nonRound2Submissions = allSubmissions
                .Where(s => !round2CompetitorIds.Contains(s.SubmissionId) && !s.IsDisqualified)
                .OrderByDescending(s => s.Round1Score ?? 0)
                .ToList();

            int nextRank = round2Competitors.Count + 1;

            foreach (var submission in nonRound2Submissions)
            {
                submission.FinalRank = nextRank++;
                await _submissionRepository.UpdateAsync(submission);

                _logger.LogInformation($"Final Ranking - Position {submission.FinalRank}: Submission {submission.SubmissionId} " +
                    $"(Did not advance to Round 2, Round1Score: {submission.Round1Score ?? 0})");
            }

            // Finally, assign ranks to disqualified submissions
            var disqualifiedSubmissions = allSubmissions
                .Where(s => s.IsDisqualified)
                .ToList();

            foreach (var submission in disqualifiedSubmissions)
            {
                submission.FinalRank = nextRank++;
                await _submissionRepository.UpdateAsync(submission);

                _logger.LogInformation($"Final Ranking - Position {submission.FinalRank}: Submission {submission.SubmissionId} " +
                    $"(DISQUALIFIED)");
            }

            _logger.LogInformation($"✅ Final rankings assigned to all {allSubmissions.Count()} submissions in competition {competitionId}");
        }

        /// <summary>
        /// Assign final rankings to all submissions based on their combined scores
        /// </summary>
        private async Task AssignFinalRankingsAsync(
            List<KeyValuePair<int, (int TotalPoints, int FirstPlaceVotes, int SecondPlaceVotes, int ThirdPlaceVotes, decimal Round1Score, decimal CombinedScore, Submission Submission)>> rankedSubmissions,
            int competitionId)
        {
            var allSubmissions = await _submissionRepository.GetByCompetitionIdAsync(competitionId);
            var advancedIds = rankedSubmissions.Select(r => r.Key).ToHashSet();

            // Rank all submissions by their combined score
            var finalRanking = rankedSubmissions
                .OrderByDescending(s => s.Value.CombinedScore)
                .ThenByDescending(s => s.Value.FirstPlaceVotes)
                .ThenByDescending(s => s.Value.SecondPlaceVotes)
                .ThenByDescending(s => s.Value.ThirdPlaceVotes)
                .ToList();

            // Assign final ranks to advanced submissions
            for (int i = 0; i < finalRanking.Count; i++)
            {
                var submission = finalRanking[i].Value.Submission;
                submission.FinalRank = i + 1;
                await _submissionRepository.UpdateAsync(submission);

                _logger.LogInformation($"Final Ranking - Position {i + 1}: Submission {submission.SubmissionId} " +
                    $"(Combined Score: {finalRanking[i].Value.CombinedScore})");
            }

            // Set final rank for non-advanced submissions (they get ranks after all finalists)
            var nonAdvancedSubmissions = allSubmissions.Where(s => !advancedIds.Contains(s.SubmissionId)).ToList();
            int nextRank = finalRanking.Count + 1;

            foreach (var submission in nonAdvancedSubmissions)
            {
                submission.FinalRank = nextRank++;
                await _submissionRepository.UpdateAsync(submission);
            }
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

            // Update competition status and set completion date
            competition.Status = CompetitionStatus.Completed;
            competition.CompletedDate = DateTime.UtcNow;
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