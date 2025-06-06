import apiService from "./apiService";

/**
 * Authentication service with comprehensive error handling
 * Handles all authentication-related API operations including login, registration,
 * password reset, and authentication status
 */
const authService = {
  /**
   * Log in a user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {boolean} credentials.rememberMe - Whether to remember the user
   * @returns {Promise<Object>} Login result with user and token
   */
  login: async (credentials) => {
    const result = await apiService.post("/api/auth/login", credentials, {
      errorContext: "User Login",
    });

    // Store token if available
    if (result && result.token) {
      localStorage.setItem("token", result.token);
    }

    return result;
  },

  /**
   * Register a new user
   * @param {Object} userData - Registration data
   * @param {string} userData.email - User email
   * @param {string} userData.username - User username
   * @param {string} userData.password - User password
   * @returns {Promise<Object>} Registration result
   */
  register: async (userData) => {
    const result = await apiService.post("/api/auth/register", userData, {
      errorContext: "User Registration",
    });

    // Store token if available
    if (result && result.token) {
      localStorage.setItem("token", result.token);
    }

    return result;
  },

  /**
   * Log out the current user
   * @returns {Promise<Object>} Logout result
   */
  logout: async () => {
    try {
      // Call the logout endpoint to invalidate the token on the server
      await apiService.post(
        "/api/auth/logout",
        {},
        {
          errorContext: "User Logout",
        }
      );
    } catch (error) {
      // Even if there's an error, we should still clear local storage
      console.error("Error during logout:", error);
    } finally {
      // Clear local token
      localStorage.removeItem("token");
    }

    return { success: true, message: "Successfully logged out" };
  },

  /**
   * Check if the user is authenticated
   * @returns {Promise<Object>} Authentication status
   */
  checkAuthStatus: async () => {
    // Check if we have a token
    const token = localStorage.getItem("token");
    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    try {
      // Validate the token with the server
      const result = await apiService.get(
        "/api/auth/status",
        {},
        {
          errorContext: "Authentication Check",
        }
      );

      return {
        isAuthenticated: true,
        user: result.user || result,
      };
    } catch (error) {
      // Clear invalid token
      localStorage.removeItem("token");
      return { isAuthenticated: false, user: null };
    }
  },

  /**
   * Request a password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Password reset request result
   */
  requestPasswordReset: async (email) => {
    return apiService.post(
      "/api/auth/forgot-password",
      { email },
      {
        errorContext: "Password Reset Request",
      }
    );
  },

  /**
   * Reset password with a token
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.token - Reset token
   * @param {string} resetData.password - New password
   * @returns {Promise<Object>} Password reset result
   */
  resetPassword: async (resetData) => {
    return apiService.post("/api/auth/reset-password", resetData, {
      errorContext: "Password Reset",
    });
  },

  /**
   * Verify email with a token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Email verification result
   */
  verifyEmail: async (token) => {
    return apiService.post(
      "/api/auth/verify-email",
      { token },
      {
        errorContext: "Email Verification",
      }
    );
  },

  /**
   * Resend email verification
   * @returns {Promise<Object>} Resend verification result
   */
  resendVerification: async () => {
    return apiService.post(
      "/api/auth/resend-verification",
      {},
      {
        errorContext: "Resend Email Verification",
      }
    );
  },
};

export default authService;
