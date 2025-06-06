import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Get all competitions
export const fetchCompetitions = createAsyncThunk(
  "competitions/fetchCompetitions",
  async (params, { rejectWithValue }) => {
    try {
      console.log("Fetching competitions with params:", params);
      const response = await api.get("/api/competitions", { params });
      console.log("Raw Competitions API response:", response);
      console.log("Competitions API response data:", response.data);

      // Default values in case of unexpected response format
      let items = [];
      let totalCount = 0;

      // Function to extract competitions from any response format
      const extractCompetitions = (data) => {
        console.log("Extracting competitions from:", data);

        // Check if the data is directly an array of competitions
        if (Array.isArray(data)) {
          console.log(
            "Direct array detected with",
            data.length,
            "competitions"
          );
          // Verify each competition has an ID
          const validCompetitions = data.map((comp) => {
            if (!comp.id && comp.competitionId) {
              // If id is missing but competitionId exists, add id property
              return { ...comp, id: comp.competitionId };
            }
            return comp;
          });
          return {
            items: validCompetitions,
            totalCount: validCompetitions.length,
          };
        }

        // Check if data is an object with a known property containing competitions
        if (data && typeof data === "object") {
          // First check for standard response format from our API
          if (data.competitions && Array.isArray(data.competitions)) {
            console.log(
              `Found competitions in 'competitions' property with`,
              data.competitions.length,
              "competitions"
            );
            // Verify each competition has an ID
            const validCompetitions = data.competitions.map((comp) => {
              if (!comp.id && comp.competitionId) {
                // If id is missing but competitionId exists, add id property
                return { ...comp, id: comp.competitionId };
              }
              return comp;
            });
            return {
              items: validCompetitions,
              totalCount: data.totalCount || validCompetitions.length,
            };
          }

          // Check alternative property names
          const possibleCompetitionsProps = [
            "items",
            "data",
            "results",
            "content",
          ];

          // Log all root keys to help diagnose
          console.log("Response object keys:", Object.keys(data));

          // Try each possible property name
          for (const prop of possibleCompetitionsProps) {
            if (data[prop] && Array.isArray(data[prop])) {
              console.log(
                `Found competitions in '${prop}' property with`,
                data[prop].length,
                "competitions"
              );
              // Verify each competition has an ID
              const validCompetitions = data[prop].map((comp) => {
                if (!comp.id && comp.competitionId) {
                  // If id is missing but competitionId exists, add id property
                  return { ...comp, id: comp.competitionId };
                }
                return comp;
              });
              return {
                items: validCompetitions,
                totalCount:
                  data.totalCount || data.total || validCompetitions.length,
              };
            }
          }

          // Fallback: Handle legacy or non-standard formats
          // If we have totalCount but no obvious items array
          if (
            data.totalCount !== undefined &&
            typeof data.totalCount === "number"
          ) {
            // Look for any array property in the object
            for (const key in data) {
              if (Array.isArray(data[key])) {
                console.log(`Found array in '${key}' property as fallback`);
                // Verify each competition has an ID
                const validCompetitions = data[key].map((comp) => {
                  if (!comp.id && comp.competitionId) {
                    // If id is missing but competitionId exists, add id property
                    return { ...comp, id: comp.competitionId };
                  }
                  return comp;
                });
                return {
                  items: validCompetitions,
                  totalCount: data.totalCount,
                };
              }
            }
          }

          // Direct examination of the object structure
          console.log("Detailed inspection of response object:");
          for (const key in data) {
            const value = data[key];
            console.log(
              `Key: ${key}, Type: ${typeof value}, Is Array: ${Array.isArray(
                value
              )}`
            );
            if (Array.isArray(value) && value.length > 0) {
              console.log(`First item in ${key}:`, value[0]);
            }
          }
        }

        // Return a safe default if no transformation was possible
        console.warn(
          "Could not extract competitions from response, using safe defaults"
        );
        return { items: [], totalCount: 0 };
      };

      // Process the response data
      const result = extractCompetitions(response.data);
      console.log("Extracted competition data:", result);

      // Ensure we always return a valid object with items and totalCount
      return {
        items: result.items || [],
        totalCount: result.totalCount || 0,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      };
    } catch (error) {
      console.error("Error fetching competitions:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch competitions"
      );
    }
  }
);

// Get competition by ID
export const fetchCompetitionById = createAsyncThunk(
  "competitions/fetchCompetitionById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id || id === "undefined") {
        console.error("Invalid competition ID provided:", id);
        return rejectWithValue("Invalid competition ID provided");
      }

      console.log(`Fetching competition with ID: ${id}`);
      const response = await api.get(`/api/competitions/${id}`);
      console.log("Competition detail API response:", response.data);

      // Handle empty response
      if (!response.data) {
        console.warn(`Competition with ID ${id} returned empty data`);
        return rejectWithValue("Competition not found");
      }

      // Ensure we have a valid competition object
      if (typeof response.data !== "object") {
        console.warn(
          `Invalid competition data format for ID ${id}:`,
          response.data
        );
        return rejectWithValue("Invalid competition data format");
      }

      // Try to normalize the response if possible
      if (response.data.competition) {
        console.log("Found competition data in 'competition' property");
        return response.data.competition;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching competition ${id}:`, error);
      return rejectWithValue(
        error.response?.data?.message ||
          `Failed to fetch competition (ID: ${id})`
      );
    }
  }
);

// Get competition results
export const fetchCompetitionResults = createAsyncThunk(
  "competitions/fetchCompetitionResults",
  async (id, { rejectWithValue }) => {
    try {
      console.log(`Fetching results for competition ID: ${id}`);
      const response = await api.get(`/api/competitions/${id}/results`);
      console.log("Competition results API response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching competition results ${id}:`, error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch competition results"
      );
    }
  }
);

// Download competition multitrack zip
export const downloadMultitrack = createAsyncThunk(
  "competitions/downloadMultitrack",
  async (id, { rejectWithValue }) => {
    try {
      // Validate the competition ID
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid competition ID for multitrack download:', id);
        return rejectWithValue('Invalid competition ID');
      }

      console.log(`Downloading multitrack for competition ID: ${id}`);
      const response = await api.get(
        `/api/competitions/${id}/download-multitrack`
      );
      console.log("Multitrack download response:", response.data);

      // The API returns a pre-signed URL that we'll return for the client to use
      return response.data;
    } catch (error) {
      console.error(
        `Error downloading multitrack for competition ${id}:`,
        error
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to download multitrack file"
      );
    }
  }
);

// Create a new competition
export const createCompetition = createAsyncThunk(
  "competitions/createCompetition",
  async (competitionData, { rejectWithValue }) => {
    try {
      console.log("Creating competition with data:", competitionData);
      const response = await api.post("/api/competitions", competitionData);
      console.log("Create competition response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating competition:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to create competition"
      );
    }
  }
);

// Submit entry to competition
export const submitCompetitionEntry = createAsyncThunk(
  "competitions/submitEntry",
  async ({ competitionId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/competitions/${competitionId}/submissions`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit entry"
      );
    }
  }
);

// Get user submission async thunk
export const getUserSubmission = createAsyncThunk(
  "competitions/getUserSubmission",
  async (competitionId, { rejectWithValue }) => {
    try {
      console.log(`[getUserSubmission] Fetching submission for competition ${competitionId}`);
      const response = await api.get(
        `/api/competitions/${competitionId}/submissions/my-submission`
      );
      console.log(`[getUserSubmission] Success:`, response.data);
      
      // Handle new structured response format
      if (response.data && typeof response.data === 'object') {
        if (response.data.hasSubmission === false) {
          console.log(`[getUserSubmission] No submission found for competition ${competitionId} (structured response)`);
          return null; // No submission found - this is a valid state
        }
        
        if (response.data.hasSubmission === true && response.data.submission) {
          console.log(`[getUserSubmission] Found submission for competition ${competitionId}`);
          return response.data.submission; // Return the actual submission data
        }
      }
      
      // Fallback for direct submission response (backward compatibility)
      return response.data;
    } catch (error) {
      // Log actual errors 
      console.error(`[getUserSubmission] Error fetching submission:`, error);
      console.error(`[getUserSubmission] Error response:`, error.response);
      
      const errorMessage = error.response?.data?.message || "Failed to get user submission";
      console.error(`[getUserSubmission] Rejecting with error: ${errorMessage}`);
      return rejectWithValue(errorMessage);
    }
  }
);

// Get all user submissions async thunk
export const getUserSubmissions = createAsyncThunk(
  "competitions/getUserSubmissions",
  async ({ page = 1, pageSize = 10, statusFilter = null, competitionStatusFilter = null } = {}, { rejectWithValue }) => {
    try {
      console.log(`[getUserSubmissions] Fetching all user submissions - Page: ${page}, PageSize: ${pageSize}`);
      console.log(`[getUserSubmissions] Filters - Status: ${statusFilter}, CompetitionStatus: ${competitionStatusFilter}`);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      if (statusFilter) {
        params.append('statusFilter', statusFilter);
      }
      
      if (competitionStatusFilter) {
        params.append('competitionStatusFilter', competitionStatusFilter);
      }
      
      const response = await api.get(`/api/users/submissions/my-submissions?${params}`);
      console.log(`[getUserSubmissions] Success:`, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`[getUserSubmissions] Error fetching submissions:`, error);
      console.error(`[getUserSubmissions] Error response:`, error.response);
      
      const errorMessage = error.response?.data?.message || "Failed to get user submissions";
      console.error(`[getUserSubmissions] Rejecting with error: ${errorMessage}`);
      return rejectWithValue(errorMessage);
    }
  }
);

// Delete user submission async thunk
export const deleteUserSubmission = createAsyncThunk(
  "competitions/deleteUserSubmission",
  async ({ competitionId, submissionId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/api/competitions/${competitionId}/submissions/${submissionId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete submission"
      );
    }
  }
);

const initialState = {
  competitions: [],
  totalCount: 0,
  competition: null,
  results: null,
  loading: false,
  loadingResults: false,
  downloadingMultitrack: false,
  multitrackUrl: null,
  multitrackError: null,
  error: null,
  errorResults: null,
  page: 1,
  pageSize: 10,
  submitting: false,
  submission: null,
  createdCompetition: null,
  userSubmission: null,
  loadingUserSubmission: false,
  deletingSubmission: false,
  // New state for user submissions list
  userSubmissions: [],
  userSubmissionsTotalCount: 0,
  userSubmissionsPage: 1,
  userSubmissionsPageSize: 10,
  loadingUserSubmissions: false,
  userSubmissionsError: null,
};

const competitionSlice = createSlice({
  name: "competitions",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearCompetitionDetail: (state) => {
      state.competition = null;
      state.results = null;
    },
    clearSubmission: (state) => {
      state.submission = null;
    },
    clearCreatedCompetition: (state) => {
      state.createdCompetition = null;
    },
    clearCompetitionError: (state) => {
      state.error = null;
    },
    clearCompetition: (state) => {
      state.competition = null;
    },
    clearResults: (state) => {
      state.results = null;
    },
    clearMultitrackData: (state) => {
      state.multitrackUrl = null;
      state.multitrackError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch competitions cases
      .addCase(fetchCompetitions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompetitions.fulfilled, (state, action) => {
        state.loading = false;
        console.log(
          "Processing competitions response in reducer:",
          action.payload
        );

        // Now we have a consistent format from our thunk action
        if (action.payload) {
          // Get competitions from items array
          state.competitions = action.payload.items || [];
          // Get totalCount
          state.totalCount = action.payload.totalCount || 0;
          state.page = action.payload.page || 1;
          state.pageSize = action.payload.pageSize || 10;

          console.log(
            `Set ${state.competitions.length} competitions (total count: ${state.totalCount})`
          );
        } else {
          // Fallback in case of unexpected payload
          console.error(
            "Unexpected competitions response format:",
            action.payload
          );
          state.competitions = [];
          state.totalCount = 0;
        }

        // Always log the result for debugging
        console.log("Competitions in state:", state.competitions);
      })
      .addCase(fetchCompetitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      })

      // Fetch competition by ID cases
      .addCase(fetchCompetitionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompetitionById.fulfilled, (state, action) => {
        state.loading = false;
        state.competition = action.payload;
      })
      .addCase(fetchCompetitionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      })

      // Fetch competition results cases
      .addCase(fetchCompetitionResults.pending, (state) => {
        state.loadingResults = true;
        state.errorResults = null;
      })
      .addCase(fetchCompetitionResults.fulfilled, (state, action) => {
        state.loadingResults = false;
        state.results = action.payload;
      })
      .addCase(fetchCompetitionResults.rejected, (state, action) => {
        state.loadingResults = false;
        state.errorResults = action.payload || "An error occurred";
      })

      // Create competition cases
      .addCase(createCompetition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompetition.fulfilled, (state, action) => {
        state.loading = false;
        state.createdCompetition = action.payload;
      })
      .addCase(createCompetition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Submit competition entry cases
      .addCase(submitCompetitionEntry.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitCompetitionEntry.fulfilled, (state, action) => {
        state.submitting = false;
        state.submission = action.payload;
      })
      .addCase(submitCompetitionEntry.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Get user submission cases
      .addCase(getUserSubmission.pending, (state) => {
        state.loadingUserSubmission = true;
        state.error = null;
      })
      .addCase(getUserSubmission.fulfilled, (state, action) => {
        state.loadingUserSubmission = false;
        state.userSubmission = action.payload;
      })
      .addCase(getUserSubmission.rejected, (state, action) => {
        state.loadingUserSubmission = false;
        state.error = action.payload || "An error occurred";
      })

      // Get all user submissions cases
      .addCase(getUserSubmissions.pending, (state) => {
        state.loadingUserSubmissions = true;
        state.userSubmissionsError = null;
      })
      .addCase(getUserSubmissions.fulfilled, (state, action) => {
        state.loadingUserSubmissions = false;
        state.userSubmissions = action.payload.submissions || [];
        state.userSubmissionsTotalCount = action.payload.totalCount || 0;
        state.userSubmissionsPage = action.payload.page || 1;
        state.userSubmissionsPageSize = action.payload.pageSize || 10;
        console.log(`[getUserSubmissions] Updated state with ${state.userSubmissions.length} submissions (total: ${state.userSubmissionsTotalCount})`);
      })
      .addCase(getUserSubmissions.rejected, (state, action) => {
        state.loadingUserSubmissions = false;
        state.userSubmissionsError = action.payload || "An error occurred";
        state.userSubmissions = [];
      })

      // Delete user submission cases
      .addCase(deleteUserSubmission.pending, (state) => {
        state.deletingSubmission = true;
        state.error = null;
      })
      .addCase(deleteUserSubmission.fulfilled, (state, action) => {
        state.deletingSubmission = false;
        state.userSubmission = null;
        // Also remove from the submissions list if it exists
        state.userSubmissions = state.userSubmissions.filter(
          submission => submission.submissionId !== action.meta.arg.submissionId
        );
        state.userSubmissionsTotalCount = Math.max(0, state.userSubmissionsTotalCount - 1);
      })
      .addCase(deleteUserSubmission.rejected, (state, action) => {
        state.deletingSubmission = false;
        state.error = action.payload || "An error occurred";
      })

      // Download multitrack cases
      .addCase(downloadMultitrack.pending, (state) => {
        state.downloadingMultitrack = true;
        state.multitrackError = null;
        state.multitrackUrl = null;
      })
      .addCase(downloadMultitrack.fulfilled, (state, action) => {
        state.downloadingMultitrack = false;
        state.multitrackUrl = action.payload.downloadUrl;
      })
      .addCase(downloadMultitrack.rejected, (state, action) => {
        state.downloadingMultitrack = false;
        state.multitrackError =
          action.payload || "Failed to download multitrack";
      });
  },
});

export const {
  setPage,
  setPageSize,
  clearCompetitionDetail,
  clearSubmission,
  clearCreatedCompetition,
  clearCompetitionError,
  clearCompetition,
  clearResults,
  clearMultitrackData,
} = competitionSlice.actions;

export default competitionSlice.reducer;
