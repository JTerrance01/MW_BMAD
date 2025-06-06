import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Fetch latest blog articles
export const fetchLatestArticles = createAsyncThunk(
  "blog/fetchLatestArticles",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/blog/articles", {
        params: {
          pageNumber: 1,
          pageSize: params?.pageSize || 1, // Default to 1 item for the spotlight
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching blog articles:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blog articles"
      );
    }
  }
);

// Fetch user activities for community spotlights
export const fetchUserActivities = createAsyncThunk(
  "blog/fetchUserActivities",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/useractivity/activities", {
        params: {
          pageNumber: 1,
          pageSize: params?.pageSize || 3,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user activities:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user activities"
      );
    }
  }
);

// Fetch newest registered users
export const fetchNewestUsers = createAsyncThunk(
  "blog/fetchNewestUsers",
  async (_, { rejectWithValue }) => {
    try {
      // Assume we have an endpoint to fetch newest users
      const response = await api.get("/api/userprofile/newest-users");
      return response.data;
    } catch (error) {
      console.error("Error fetching newest users:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch newest users"
      );
    }
  }
);

// Initial state
const initialState = {
  latestArticles: [],
  userActivities: [],
  newestUsers: [],
  loading: false,
  error: null,
  communitySpotlight: {
    blogPost: null,
    discussion: null,
    newMember: null,
    loading: false,
    error: null,
  },
};

// Create slice
const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearBlogData: (state) => {
      state.latestArticles = [];
      state.userActivities = [];
      state.newestUsers = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Latest articles cases
      .addCase(fetchLatestArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLatestArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.latestArticles = action.payload.articles || [];
        // Set the latest blog post for community spotlight
        if (state.latestArticles.length > 0) {
          state.communitySpotlight.blogPost = state.latestArticles[0];
        }
      })
      .addCase(fetchLatestArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // User activities cases
      .addCase(fetchUserActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.userActivities = action.payload.items || [];

        // Set a discussion-type activity for the community spotlight
        const discussionActivity = state.userActivities.find(
          (activity) =>
            activity.activityType === "ForumPost" ||
            activity.activityType === "ForumReply"
        );

        if (discussionActivity) {
          state.communitySpotlight.discussion = discussionActivity;
        }
      })
      .addCase(fetchUserActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Newest users cases
      .addCase(fetchNewestUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewestUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.newestUsers = action.payload || [];

        // Set a new member for the community spotlight
        if (state.newestUsers.length > 0) {
          state.communitySpotlight.newMember = state.newestUsers[0];
        }
      })
      .addCase(fetchNewestUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBlogData } = blogSlice.actions;
export default blogSlice.reducer;
