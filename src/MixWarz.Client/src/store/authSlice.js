import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

// Helper to check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Get token from localStorage
const getStoredToken = () => {
  const token = localStorage.getItem("token");
  return token && !isTokenExpired(token) ? token : null;
};

// Normalize roles to handle different formats
const normalizeRoles = (roles) => {
  // If no roles, return empty array
  if (!roles) return [];

  // If roles is a string, convert to array
  if (typeof roles === "string") {
    return [roles];
  }

  // If roles is already an array, return as is
  if (Array.isArray(roles)) {
    return roles;
  }

  // If roles is an object with numeric keys (like the one from JWT)
  if (typeof roles === "object") {
    // Convert object to array
    const rolesArray = [];
    for (const key in roles) {
      if (!isNaN(parseInt(key)) && typeof roles[key] === "string") {
        rolesArray.push(roles[key]);
      }
    }
    if (rolesArray.length > 0) {
      return rolesArray;
    }
  }

  // For any other unexpected format, return empty array
  return [];
};

// Get user info from token
const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    console.log("JWT Decoded payload:", decoded);

    // Check multiple possible properties where roles might be stored
    // Try role, roles, userRoles, and requiredRoles properties
    let roles = [];
    if (decoded.role) {
      roles = normalizeRoles(decoded.role);
    } else if (decoded.roles) {
      roles = normalizeRoles(decoded.roles);
    } else if (decoded.userRoles) {
      roles = normalizeRoles(decoded.userRoles);
    } else if (decoded.requiredRoles) {
      roles = normalizeRoles(decoded.requiredRoles);
    }

    console.log("Normalized roles:", roles);

    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      username: decoded.name || decoded.username,
      roles: roles,
    };
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

// Login user
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log(`Attempting login for email: ${email}`);
      const response = await api.post("/api/auth/login", { email, password });

      console.log("Login response:", response);

      // Check if response has token
      if (!response.data || !response.data.token) {
        console.error("Invalid login response format:", response);
        return rejectWithValue("Login failed: Invalid server response");
      }

      const { token } = response.data;
      localStorage.setItem("token", token);
      return { token };
    } catch (error) {
      console.error("Login error:", error);

      // Enhanced error handling
      if (error.response) {
        // Server responded with error
        console.log("Error response data:", error.response.data);
        return rejectWithValue(
          error.response.data?.message ||
            `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        // No response received
        console.log("No response received:", error.request);
        return rejectWithValue(
          "No response received from server. Please check your connection."
        );
      } else {
        // Request setup error
        console.log("Request error:", error.message);
        return rejectWithValue(error.message || "Login failed");
      }
    }
  }
);

// Register user
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    { username, email, password, firstName, lastName },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/api/auth/register", {
        username,
        email,
        password,
        firstName,
        lastName,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Refresh token
export const refreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    const token = getStoredToken();

    if (!token) {
      return rejectWithValue("No valid token found");
    }

    return { token };
  }
);

// Fetch complete user profile
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      // Only proceed if authenticated
      const { isAuthenticated } = getState().auth;
      if (!isAuthenticated) {
        return rejectWithValue("Not authenticated");
      }

      // Get the full user profile
      const response = await api.get("/api/UserProfile/me");
      console.log("Fetched user profile:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  }
);

const initialState = {
  token: getStoredToken(),
  user: getUserFromToken(getStoredToken()),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action) => {
      // Update specific user properties
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = getUserFromToken(action.payload.token);
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Refresh token cases
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = getUserFromToken(action.payload.token);
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Fetch user profile cases
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        // Merge the profile data with existing user data
        if (state.user) {
          state.user = {
            ...state.user,
            // Preserve important fields from JWT like roles
            ...action.payload,
            // Make sure we keep roles from JWT if they exist
            roles: state.user.roles || [],
          };
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        console.error("Failed to fetch user profile:", action.payload);
        // Don't modify state on rejection, just log the error
      });
  },
});

export const { logout, clearError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
