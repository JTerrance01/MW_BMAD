import axios from "axios";

/**
 * Hybrid Fair-Play Tournament Service
 * Migrates from old round-based voting system to new judging system
 */
class HybridTournamentService {
  constructor() {
    this.baseURL = "https://localhost:7001";
    this.apiVersion = "v2";
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * START JUDGING: Replaces old round1/create-groups functionality
   * Transitions competition to judging phase and creates judging assignments
   */
  async startUniversalJudging(competitionId) {
    try {
      console.log(`🎯 [HybridTournament] Starting universal judging for competition ${competitionId}`);
      
      const response = await axios.post(
        `${this.baseURL}/api/${this.apiVersion}/competitions/${competitionId}/start-judging`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );

      console.log(`✅ [HybridTournament] Start judging response:`, response.data);
      
      const assignmentsCreated = response.data.assignmentsCreated || 0;
      const message = assignmentsCreated === 0 
        ? "Judging phase is already active. Existing assignments found."
        : `Universal judging started successfully. ${assignmentsCreated} judging assignments created.`;
      
      return {
        success: true,
        message: message,
        assignmentsCreated: assignmentsCreated,
        data: response.data
      };
    } catch (error) {
      console.error(`❌ [HybridTournament] Error starting judging:`, error);
      throw this.handleApiError(error, "Failed to start universal judging");
    }
  }

  /**
   * TALLY RESULTS: Replaces old round1/tally-votes and round2/tally-votes functionality
   * Calculates final scores and determines advancement/winners
   */
  async tallyUniversalJudgingResults(competitionId, advancementCount = null) {
    try {
      console.log(`🎯 [HybridTournament] Tallying results for competition ${competitionId}`);
      
      const params = {};
      if (advancementCount !== null) {
        params.advancementCount = advancementCount;
      }

      const response = await axios.post(
        `${this.baseURL}/api/${this.apiVersion}/competitions/${competitionId}/tally-results`,
        {},
        {
          headers: this.getAuthHeaders(),
          params
        }
      );

      console.log(`✅ [HybridTournament] Tally results response:`, response.data);
      return {
        success: true,
        message: response.data.message || "Judging results tallied successfully",
        advancementCount: response.data.advancementCount,
        eliminatedCount: response.data.eliminatedCount,
        competitionCompleted: response.data.competitionCompleted,
        data: response.data
      };
    } catch (error) {
      console.error(`❌ [HybridTournament] Error tallying results:`, error);
      throw this.handleApiError(error, "Failed to tally judging results");
    }
  }

  /**
   * Submit a judgement for a submission
   */
  async submitJudgement(submissionId, judgementData) {
    try {
      console.log(`🎯 [HybridTournament] Submitting judgement for submission ${submissionId}`);
      
      const response = await axios.post(
        `${this.baseURL}/api/${this.apiVersion}/submissions/${submissionId}/judgements`,
        judgementData,
        {
          headers: this.getAuthHeaders(),
        }
      );

      console.log(`✅ [HybridTournament] Submit judgement response:`, response.data);
      return {
        success: true,
        message: "Judgement submitted successfully",
        judgementId: response.data.judgementId,
        data: response.data
      };
    } catch (error) {
      console.error(`❌ [HybridTournament] Error submitting judgement:`, error);
      throw this.handleApiError(error, "Failed to submit judgement");
    }
  }

  /**
   * Rate feedback helpfulness
   */
  async rateFeedback(judgementId, ratingData) {
    try {
      console.log(`🎯 [HybridTournament] Rating feedback for judgement ${judgementId}`);
      
      const response = await axios.post(
        `${this.baseURL}/api/${this.apiVersion}/judgements/${judgementId}/rate`,
        ratingData,
        {
          headers: this.getAuthHeaders(),
        }
      );

      console.log(`✅ [HybridTournament] Rate feedback response:`, response.data);
      return {
        success: true,
        message: "Feedback rating submitted successfully",
        data: response.data
      };
    } catch (error) {
      console.error(`❌ [HybridTournament] Error rating feedback:`, error);
      throw this.handleApiError(error, "Failed to rate feedback");
    }
  }

  /**
   * MIGRATION COMPATIBILITY LAYER
   * These methods provide backward compatibility for existing frontend code
   */

  /**
   * Migration wrapper for old handleCreateVotingGroups
   * Maps to new startUniversalJudging
   */
  async createVotingGroups(competitionId, targetGroupSize = 20) {
    console.log(`🔄 [Migration] createVotingGroups -> startUniversalJudging`);
    return await this.startUniversalJudging(competitionId);
  }

  /**
   * Migration wrapper for old handleTallyVotes (Round 1)
   * Maps to new tallyUniversalJudgingResults with advancement
   */
  async tallyRound1Votes(competitionId) {
    console.log(`🔄 [Migration] tallyRound1Votes -> tallyUniversalJudgingResults`);
    // In the old system, Round 1 typically advanced top submissions to Round 2
    // In the new system, we can specify advancement count or let the system decide
    return await this.tallyUniversalJudgingResults(competitionId, 10); // Advance top 10
  }

  /**
   * Migration wrapper for old handleTallyRound2Votes
   * Maps to new tallyUniversalJudgingResults for final results
   */
  async tallyRound2Votes(competitionId) {
    console.log(`🔄 [Migration] tallyRound2Votes -> tallyUniversalJudgingResults`);
    // Round 2 determines the final winner
    return await this.tallyUniversalJudgingResults(competitionId);
  }

  /**
   * Get competition judging statistics
   * Replaces old voting statistics endpoints
   */
  async getJudgingStats(competitionId) {
    try {
      console.log(`📊 [HybridTournament] Getting judging stats for competition ${competitionId}`);
      
      // Since we don't have a specific stats endpoint in the v2 API yet,
      // we'll use the competition details endpoint for now
      // This can be enhanced later with a dedicated stats endpoint
      const response = await axios.get(
        `${this.baseURL}/api/competitions/${competitionId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const competition = response.data;
      
      // Transform to match old voting stats format for compatibility
      const stats = {
        totalJudges: competition.numberOfJudges || 0,
        judgesCompleted: competition.completedJudgements || 0,
        judgingCompletionPercentage: competition.judgingProgress || 0,
        assignmentCount: competition.judgingAssignments || 0,
        setupComplete: competition.status === "InJudging" || competition.status === "JudgingComplete",
        setupMessage: this.getJudgingSetupMessage(competition.status)
      };

      console.log(`✅ [HybridTournament] Judging stats:`, stats);
      return stats;
    } catch (error) {
      console.error(`❌ [HybridTournament] Error getting judging stats:`, error);
      // Return default stats to prevent UI crashes
      return {
        totalJudges: 0,
        judgesCompleted: 0,
        judgingCompletionPercentage: 0,
        assignmentCount: 0,
        setupComplete: false,
        setupMessage: "Unable to load judging statistics"
      };
    }
  }

  /**
   * Helper to generate setup messages for judging phase
   */
  getJudgingSetupMessage(status) {
    switch (status) {
      case "OpenForSubmissions":
        return "Competition ready for judging setup. Transition to judging phase.";
      case "InJudging":
        return "Judging phase active. Judges can submit their evaluations.";
      case "JudgingComplete":
        return "Judging complete. Ready to tally results and determine winners.";
      case "Completed":
        return "Competition completed with results finalized.";
      default:
        return "Check competition status for judging eligibility.";
    }
  }

  /**
   * Handle API errors consistently
   */
  handleApiError(error, defaultMessage) {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      return new Error("Competition not in correct status for this operation");
    } else if (error.response?.status === 404) {
      return new Error("Competition or endpoint not found");
    } else if (error.response?.status === 401) {
      return new Error("Authentication required. Please log in.");
    } else if (error.response?.status === 403) {
      return new Error("Insufficient permissions for this operation");
    } else {
      return new Error(defaultMessage || error.message || "An unexpected error occurred");
    }
  }

  /**
   * Check if competition is ready for judging migration
   */
  isReadyForJudging(competition) {
    const eligibleStatuses = [
      "OpenForSubmissions",
      "VotingRound1Setup", // Old system status
      "VotingRound1Open",  // Old system status
      "InJudging"          // New system status
    ];
    return eligibleStatuses.includes(competition.status);
  }

  /**
   * Check if competition can have results tallied
   */
  canTallyResults(competition) {
    const eligibleStatuses = [
      "VotingRound1Open",    // Old system - can migrate to new tally
      "VotingRound2Open",    // Old system - can migrate to new tally
      "VotingRound2Tallying", // Old system - can migrate to new tally
      "InJudging",           // New system - can tally
      "JudgingComplete"      // New system - can tally
    ];
    return eligibleStatuses.includes(competition.status);
  }
}

// Export singleton instance
export default new HybridTournamentService();
