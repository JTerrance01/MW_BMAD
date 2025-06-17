import apiService from "./apiService";

/**
 * User profile service with comprehensive error handling
 * Handles all user-related API operations including profile management,
 * password changes, and profile picture uploads
 */
const userService = {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  getCurrentUserProfile: async () => {
    return apiService.get(
      "/api/UserProfile/me",
      {},
      {
        errorContext: "Current User Profile",
      }
    );
  },

  /**
   * Get user profile by username
   * @param {string} username - Username to fetch
   * @returns {Promise<Object>} User profile data
   */
  getUserProfile: async (username) => {
    return apiService.get(
      `/api/UserProfile/${username}`,
      {},
      {
        errorContext: `User Profile (${username})`,
      }
    );
  },

  /**
   * Update user profile information
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  updateProfile: async (profileData) => {
    return apiService.put("/api/UserProfile", profileData, {
      errorContext: "Profile Update",
    });
  },

  /**
   * Update user bio
   * @param {string} bio - New bio text
   * @returns {Promise<Object>} Update result
   */
  updateBio: async (bio) => {
    return apiService.put(
      "/api/UserProfile/bio",
      { bio },
      {
        errorContext: "Bio Update",
      }
    );
  },

  /**
   * Upload profile picture
   * @param {File} file - Image file to upload
   * @param {Function} onProgress - Progress callback
   * @param {string} userId - Optional user ID to include in request
   * @returns {Promise<Object>} Upload result with new image URL
   */
  uploadProfilePicture: async (file, onProgress, userId = null) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `Invalid file type: ${file.type}. Please select a JPEG or PNG image.`,
        },
        message: `Invalid file type: ${file.type}. Please select a JPEG or PNG image.`,
      };
    }

    // Validate file size
    const maxSizeMB = 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `File size (${(file.size / 1024 / 1024).toFixed(
            2
          )}MB) exceeds the maximum allowed (${maxSizeMB}MB).`,
        },
        message: `File size (${(file.size / 1024 / 1024).toFixed(
          2
        )}MB) exceeds the maximum allowed (${maxSizeMB}MB).`,
      };
    }

    // Create additional data object with userId if provided
    const additionalData = {};
    if (userId) {
      // Add in both formats to ensure compatibility
      additionalData.UserId = userId;
      additionalData.userId = userId;
    }

    return apiService.uploadFile(
      "/api/UserProfile/update-profile-picture",
      file,
      additionalData,
      {
        errorContext: "Profile Picture Upload",
        onProgress,
        fileFieldName: "ProfilePicture", // Always use this consistent field name
        headers: {
          Accept: "application/json",
        },
      }
    );
  },

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @param {string} passwordData.confirmPassword - Confirm new password
   * @returns {Promise<Object>} Change result
   */
  changePassword: async (passwordData) => {
    return apiService.put("/api/UserProfile/password", passwordData, {
      errorContext: "Password Change",
    });
  },

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Update result
   */
  updateNotificationPreferences: async (preferences) => {
    return apiService.put("/api/UserProfile/notifications", preferences, {
      errorContext: "Notification Preferences",
    });
  },

  /**
   * Get user's order history
   * @param {Object} params - Query parameters (page, pageSize, etc.)
   * @returns {Promise<Object>} Order history
   */
  getOrderHistory: async (params = {}) => {
    return apiService.get("/api/orders/history", params, {
      errorContext: "Order History",
    });
  },

  /**
   * Get user's purchased products
   * @param {Object} params - Query parameters (page, pageSize, etc.)
   * @returns {Promise<Object>} Purchased products
   */
  getPurchasedProducts: async (params = {}) => {
    return apiService.get("/api/UserProfile/purchases", params, {
      errorContext: "Purchased Products",
    });
  },

  /**
   * Get user's competition submissions
   * @param {Object} params - Query parameters (page, pageSize, etc.)
   * @returns {Promise<Object>} Competition submissions
   */
  getSubmissions: async (params = {}) => {
    return apiService.get("/api/submissions/user", params, {
      errorContext: "User Submissions",
    });
  },
};

export default userService;
