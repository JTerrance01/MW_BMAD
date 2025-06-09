import apiService from "./apiService";

/**
 * Competition service with comprehensive error handling
 * Handles all competition-related API operations
 */
const competitionService = {
  /**
   * Get list of competitions with optional filtering
   * @param {Object} params - Query parameters (status, page, pageSize, etc.)
   * @returns {Promise<Object>} List of competitions
   */
  getCompetitions: async (params = {}) => {
    return apiService.get("/api/competitions", params, {
      errorContext: "Competition List",
    });
  },

  /**
   * Get competition details by ID
   * @param {string} id - Competition ID
   * @returns {Promise<Object>} Competition details
   */
  getCompetitionById: async (id) => {
    return apiService.get(
      `/api/competitions/${id}`,
      {},
      {
        errorContext: `Competition Details (${id})`,
      }
    );
  },

  /**
   * Create a new competition
   * @param {Object} competitionData - Competition data
   * @returns {Promise<Object>} Created competition
   */
  createCompetition: async (competitionData) => {
    return apiService.post("/api/competitions", competitionData, {
      errorContext: "Competition Creation",
    });
  },

  /**
   * Update competition details
   * @param {string} id - Competition ID
   * @param {Object} competitionData - Updated competition data
   * @returns {Promise<Object>} Updated competition
   */
  updateCompetition: async (id, competitionData) => {
    return apiService.put(`/api/competitions/${id}`, competitionData, {
      errorContext: `Competition Update (${id})`,
    });
  },

  /**
   * Submit entry to a competition
   * @param {string} competitionId - Competition ID
   * @param {File} audioFile - Audio file to submit
   * @param {Object} submissionData - Additional submission data
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Submission result
   */
  submitEntry: async (
    competitionId,
    audioFile,
    submissionData = {},
    onProgress
  ) => {
    // Add competition ID to the submission data
    const submissionWithCompetitionId = {
      ...submissionData,
      competitionId,
    };

    return apiService.uploadFile(
      "/api/submissions",
      audioFile,
      submissionWithCompetitionId,
      {
        errorContext: "Competition Submission",
        onProgress,
      }
    );
  },

  /**
   * Get competition results
   * @param {string} id - Competition ID
   * @returns {Promise<Object>} Competition results
   */
  getCompetitionResults: async (id) => {
    return apiService.get(
      `/api/competitions/${id}/results`,
      {},
      {
        errorContext: `Competition Results (${id})`,
      }
    );
  },

  /**
   * Get submissions for a competition
   * @param {string} competitionId - Competition ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of submissions
   */
  getCompetitionSubmissions: async (competitionId, params = {}) => {
    return apiService.get(
      `/api/competitions/${competitionId}/submissions`,
      params,
      {
        errorContext: `Competition Submissions (${competitionId})`,
      }
    );
  },

  /**
   * Judge a submission (for admins or judges)
   * @param {string} submissionId - Submission ID
   * @param {Object} judgingData - Judging data with scores and feedback
   * @returns {Promise<Object>} Judging result
   */
  judgeSubmission: async (submissionId, judgingData) => {
    return apiService.post(
      `/api/submissions/${submissionId}/judge`,
      judgingData,
      {
        errorContext: `Judge Submission (${submissionId})`,
      }
    );
  },

  /**
   * Get submission score breakdown for a user's submission
   * @param {string} competitionId - Competition ID
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object>} Score breakdown data
   */
  getSubmissionScoreBreakdown: async (competitionId, submissionId) => {
    return apiService.get(
      `/api/competitions/${competitionId}/submissions/${submissionId}/score-breakdown`,
      {},
      {
        errorContext: `Submission Score Breakdown (${submissionId})`,
      }
    );
  },

  /**
   * Update competition status (for admins)
   * @param {string} competitionId - Competition ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  updateCompetitionStatus: async (competitionId, status) => {
    try {
      const response = await apiService.put(
        `/api/v1/admin/competitions/${competitionId}/status`,
        { newStatus: status }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating competition status:', error);
      throw error;
    }
  },
};

export default competitionService;
