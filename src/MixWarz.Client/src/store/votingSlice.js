import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

const initialState = {
  // Round 1 voting state
  round1Assignments: [],
  hasVotedRound1: false,
  round1Loading: false,
  round1Error: null,

  // Round 2 voting state
  round2Submissions: [],
  isEligibleForRound2Voting: false,
  hasVotedRound2: false,
  round2Loading: false,
  round2Error: null,

  // Scorecard scores for judging interface
  scorecardScores: {}, // { submissionId: { overallScore: number, criteriaScores: {} } }

  // Common state
  votingDeadline: null,
};

// Fetch Round 1 voting assignments
export const fetchRound1VotingAssignments = createAsyncThunk(
  "voting/fetchRound1VotingAssignments",
  async (competitionId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/competitions/${competitionId}/voting/round1/assignments`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch Round 1 voting assignments"
      );
    }
  }
);

// Submit Round 1 votes
export const submitRound1Votes = createAsyncThunk(
  "voting/submitRound1Votes",
  async (voteData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/competitions/${voteData.competitionId}/voting/round1/votes`,
        { votes: voteData.votes }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to submit Round 1 votes"
      );
    }
  }
);

// Fetch Round 2 voting submissions
export const fetchRound2VotingSubmissions = createAsyncThunk(
  "voting/fetchRound2VotingSubmissions",
  async (competitionId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/competitions/${competitionId}/voting/round2/submissions`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch Round 2 voting submissions"
      );
    }
  }
);

// Submit Round 2 votes
export const submitRound2Votes = createAsyncThunk(
  "voting/submitRound2Votes",
  async (voteData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/competitions/${voteData.competitionId}/voting/round2/votes`,
        { votes: voteData.votes }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to submit Round 2 votes"
      );
    }
  }
);

// Check voting eligibility
export const checkVotingEligibility = createAsyncThunk(
  "voting/checkVotingEligibility",
  async (competitionId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/competitions/${competitionId}/voting/eligibility`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to check voting eligibility"
      );
    }
  }
);

const votingSlice = createSlice({
  name: "voting",
  initialState,
  reducers: {
    resetVotingState: (state) => {
      return { ...initialState };
    },
    clearRound1State: (state) => {
      state.round1Assignments = [];
      state.round1Loading = false;
      state.round1Error = null;
    },
    clearRound2State: (state) => {
      state.round2Submissions = [];
      state.round2Loading = false;
      state.round2Error = null;
    },
    updateScorecardScore: (state, action) => {
      const { submissionId, overallScore, criteriaScores } = action.payload;
      state.scorecardScores[submissionId] = {
        overallScore,
        criteriaScores: criteriaScores || {}
      };
    },
    clearScorecardScores: (state) => {
      state.scorecardScores = {};
    },
  },
  extraReducers: (builder) => {
    // Round 1 voting assignments
    builder
      .addCase(fetchRound1VotingAssignments.pending, (state) => {
        state.round1Loading = true;
        state.round1Error = null;
      })
      .addCase(fetchRound1VotingAssignments.fulfilled, (state, action) => {
        state.round1Loading = false;
        state.round1Assignments = action.payload.submissions || [];
        state.hasVotedRound1 = action.payload.hasVoted || false;
        state.votingDeadline = action.payload.votingDeadline || null;
      })
      .addCase(fetchRound1VotingAssignments.rejected, (state, action) => {
        state.round1Loading = false;
        state.round1Error =
          action.payload || "Failed to fetch Round 1 voting assignments";
      })

      // Submit Round 1 votes
      .addCase(submitRound1Votes.pending, (state) => {
        state.round1Loading = true;
        state.round1Error = null;
      })
      .addCase(submitRound1Votes.fulfilled, (state) => {
        state.round1Loading = false;
        state.hasVotedRound1 = true;
      })
      .addCase(submitRound1Votes.rejected, (state, action) => {
        state.round1Loading = false;
        state.round1Error = action.payload || "Failed to submit Round 1 votes";
      })

      // Round 2 voting submissions
      .addCase(fetchRound2VotingSubmissions.pending, (state) => {
        state.round2Loading = true;
        state.round2Error = null;
      })
      .addCase(fetchRound2VotingSubmissions.fulfilled, (state, action) => {
        state.round2Loading = false;
        state.round2Submissions = action.payload.submissions || [];
        state.hasVotedRound2 = action.payload.hasVoted || false;
        state.isEligibleForRound2Voting = action.payload.isEligible || false;
        state.votingDeadline = action.payload.votingDeadline || null;
      })
      .addCase(fetchRound2VotingSubmissions.rejected, (state, action) => {
        state.round2Loading = false;
        state.round2Error =
          action.payload || "Failed to fetch Round 2 voting submissions";
      })

      // Submit Round 2 votes
      .addCase(submitRound2Votes.pending, (state) => {
        state.round2Loading = true;
        state.round2Error = null;
      })
      .addCase(submitRound2Votes.fulfilled, (state) => {
        state.round2Loading = false;
        state.hasVotedRound2 = true;
      })
      .addCase(submitRound2Votes.rejected, (state, action) => {
        state.round2Loading = false;
        state.round2Error = action.payload || "Failed to submit Round 2 votes";
      })

      // Check voting eligibility
      .addCase(checkVotingEligibility.fulfilled, (state, action) => {
        state.isEligibleForRound2Voting =
          action.payload.isEligibleForRound2 || false;
        state.hasVotedRound1 = action.payload.hasVotedRound1 || false;
        state.hasVotedRound2 = action.payload.hasVotedRound2 || false;
      });
  },
});

export const { resetVotingState, clearRound1State, clearRound2State, updateScorecardScore, clearScorecardScores } =
  votingSlice.actions;
export default votingSlice.reducer;
