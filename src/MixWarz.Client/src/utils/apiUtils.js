import apiService from "../services/apiService";
import userService from "../services/userService";

/**
 * Utility functions for common API operations
 * This file should only contain cross-service utility functions
 * or temporary backward compatibility functions
 */

/**
 * Update user's bio - DEPRECATED, use userService.updateBio instead
 * @param {string} bioText - Bio text to update
 * @returns {Promise<Object>} - Promise resolving to the API response
 * @deprecated Use userService.updateBio instead
 */
export const updateUserBio = async (bioText) => {
  console.warn(
    "updateUserBio in apiUtils is deprecated, use userService.updateBio instead"
  );
  try {
    const response = await userService.updateBio(bioText);
    return response;
  } catch (error) {
    console.error("Bio update error:", error);
    return {
      success: false,
      message: error.message || "Failed to update bio",
      error,
    };
  }
};

/**
 * Upload profile picture - DEPRECATED, use userService.uploadProfilePicture instead
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<Object>} - Promise resolving to the API response
 * @deprecated Use userService.uploadProfilePicture instead
 */
export const uploadProfilePicture = async (file, onProgress) => {
  console.warn(
    "uploadProfilePicture in apiUtils is deprecated, use userService.uploadProfilePicture instead"
  );
  return userService.uploadProfilePicture(file, onProgress);
};

/**
 * Fetch user profile - DEPRECATED, use userService.getCurrentUserProfile instead
 * @returns {Promise<Object>} - Promise resolving to the user profile
 * @deprecated Use userService.getCurrentUserProfile instead
 */
export const fetchUserProfile = async () => {
  console.warn(
    "fetchUserProfile in apiUtils is deprecated, use userService.getCurrentUserProfile instead"
  );
  try {
    const response = await userService.getCurrentUserProfile();
    return {
      success: true,
      ...response,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to fetch profile",
      error,
    };
  }
};

/**
 * Test function for bio updates
 * @private For testing purposes only
 */
export const testUpdateBio = async (bioText) => {
  console.warn("This is a test function and should not be used in production");
  return userService.updateBio(bioText);
};

/**
 * Converts a genre enum value to a human-readable string.
 * @param {string|number} genre - The genre value from the API (string or enum int).
 * @returns {string} Human-readable genre name.
 */
export function formatGenre(genre) {
  if (!genre || genre === 0 || genre === "Unknown") return "Unknown";
  const genreMap = {
    0: "Unknown",
    1: "Pop",
    2: "Rock",
    3: "Hip-Hop",
    4: "Jazz",
    5: "Classical",
    6: "Electronic",
    7: "Country",
    8: "R&B",
    9: "Reggae",
    10: "Blues",
    11: "Metal",
    12: "Folk",
    13: "World",
    99: "Other",
    Pop: "Pop",
    Rock: "Rock",
    HipHop: "Hip-Hop",
    Jazz: "Jazz",
    Classical: "Classical",
    Electronic: "Electronic",
    Country: "Country",
    RnB: "R&B",
    Reggae: "Reggae",
    Blues: "Blues",
    Metal: "Metal",
    Folk: "Folk",
    World: "World",
    Other: "Other",
  };
  return genreMap[genre] || "Unknown";
}
