import {
  trackActivity as trackActivityService,
  ActivityTypeEnum,
} from "../services/userActivityService";

// Feature flag to enable/disable activity tracking
// Check localStorage first, then use the default value
const ACTIVITY_TRACKING_ENABLED = (() => {
  try {
    const stored = localStorage.getItem("mixwarz_activity_tracking_enabled");
    if (stored !== null) {
      return stored === "true";
    }
    // Default to false until we're sure it's working properly
    return false;
  } catch (e) {
    console.warn("Error accessing localStorage:", e);
    return false;
  }
})();

// Function to check if activity tracking is enabled
export const isEnabled = () => ACTIVITY_TRACKING_ENABLED;

// Create a circuit breaker to prevent repeated failed tracking attempts
// This will stop trying to track activities if there are multiple failures
const ERROR_THRESHOLD = 3;
let errorCount = 0;
let lastErrorTime = 0;
const RESET_TIME_MS = 60000; // Reset error count after 1 minute

// Track pending activities for debugging
let activityQueue = [];

// Function to check if we should attempt tracking
const shouldAttemptTracking = () => {
  // Reset error count if it's been more than RESET_TIME_MS since last error
  if (errorCount > 0 && Date.now() - lastErrorTime > RESET_TIME_MS) {
    console.log("[ACTIVITY] Resetting error count after timeout");
    errorCount = 0;
  }

  // Don't attempt if we've exceeded the threshold
  if (errorCount >= ERROR_THRESHOLD) {
    console.warn(
      `[ACTIVITY] Circuit breaker open: ${errorCount} errors, tracking disabled until next reset`
    );
    return false;
  }

  return true;
};

// Reset the circuit breaker error counter for debugging
export const resetCircuitBreaker = () => {
  errorCount = 0;
  lastErrorTime = 0;
  console.log("[ACTIVITY] Circuit breaker manually reset");
  return true;
};

// Clear the activity queue for debugging
export const clearQueue = () => {
  const count = activityQueue.length;
  activityQueue = [];
  console.log(`[ACTIVITY] Queue cleared (${count} items removed)`);
  return true;
};

// Return debug information about the activity tracker
export const debug = () => {
  return {
    enabled: ACTIVITY_TRACKING_ENABLED,
    errorCount,
    lastErrorTime,
    circuitBreaker: {
      threshold: ERROR_THRESHOLD,
      isOpen: errorCount >= ERROR_THRESHOLD,
      resetTimeMs: RESET_TIME_MS,
      timeUntilReset:
        lastErrorTime > 0
          ? Math.max(0, RESET_TIME_MS - (Date.now() - lastErrorTime))
          : 0,
    },
    queueLength: activityQueue.length,
  };
};

// Enable/disable tracking function that persists the setting
export const setActivityTrackingEnabled = (enabled) => {
  try {
    localStorage.setItem(
      "mixwarz_activity_tracking_enabled",
      enabled ? "true" : "false"
    );
    console.log(`Activity tracking ${enabled ? "enabled" : "disabled"}`);
    // Would need to reload the page to apply this change immediately
    return true;
  } catch (e) {
    console.error("Error saving tracking preference:", e);
    return false;
  }
};

// Alias for setActivityTrackingEnabled for consistency with isEnabled
export const setEnabled = setActivityTrackingEnabled;

/**
 * Track user activity
 * @param {Object} activityData - Activity data to track
 * @param {string} activityData.type - Activity type from ActivityType enum
 * @param {string} [activityData.description] - Optional description of the activity
 * @param {string} [activityData.relatedEntityType] - Optional related entity type
 * @param {string|number} [activityData.relatedEntityId] - Optional related entity ID
 * @returns {Promise<number|void>} The activity ID or void if tracking fails
 */
export const trackActivity = async (activityData) => {
  // Skip if tracking is disabled globally
  if (!ACTIVITY_TRACKING_ENABLED) {
    console.log("[ACTIVITY] Tracking is disabled");
    return undefined;
  }

  // Check circuit breaker
  if (!shouldAttemptTracking()) {
    console.log("[ACTIVITY] Circuit breaker active, skipping tracking request");
    return undefined;
  }

  try {
    console.log("[ACTIVITY] Attempting to track activity:", activityData);
    
    // Use the service to track the activity
    const result = await trackActivityService(activityData);
    
    // Reset error count on success
    if (result !== undefined) {
      errorCount = 0;
      console.log("[ACTIVITY] Successfully tracked activity, ID:", result);
    }
    
    return result;
  } catch (error) {
    // Increment error count and update last error time
    errorCount++;
    lastErrorTime = Date.now();
    
    console.error(`[ACTIVITY] Error tracking activity (${errorCount}/${ERROR_THRESHOLD}):`, error.message);
    
    // Add to local queue for debugging
    activityQueue.push({
      ...activityData,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    // Don't throw error to avoid breaking the user experience
    return undefined;
  }
};

/**
 * Track page view
 * @param {string} pageName - The name of the page being viewed
 * @returns {Promise<void>}
 */
export const trackPageView = async (pageName) => {
  // Skip if tracking is disabled globally
  if (!ACTIVITY_TRACKING_ENABLED) {
    console.log("[ACTIVITY] Page view tracking skipped - tracking is disabled");
    return;
  }

  try {
    if (!pageName) {
      console.warn("Page name is required for activity tracking");
      return;
    }

    console.log(`[ACTIVITY] Tracking page view: ${pageName}`);

    // Record this in the queue for debugging
    activityQueue.push({
      type: "PageView",
      description: `Viewed ${pageName} page`,
      timestamp: new Date().toISOString(),
    });

    // Send the activity with the correct format
    // The ActivityTypeEnum.PageView will be converted to the numeric value 18
    await trackActivity({
      type: ActivityTypeEnum.PageView,
      description: `Viewed ${pageName} page`,
    });

    console.log(`[ACTIVITY] Successfully tracked page view: ${pageName}`);
  } catch (error) {
    console.error("Error tracking page view:", error);
    // Suppress error, don't let activity tracking break the app
  }
};

/**
 * Track product view
 * @param {number} productId - The ID of the product being viewed
 * @param {string} productName - The name of the product
 * @returns {Promise<void>}
 */
export const trackProductView = async (productId, productName) => {
  // Skip if tracking is disabled globally
  if (!ACTIVITY_TRACKING_ENABLED) return;

  try {
    await trackActivity({
      type: ActivityTypeEnum.ProductView,
      description: `Viewed product: ${productName || "Unknown product"}`,
      relatedEntityType: "Product",
      relatedEntityId: productId,
    });
  } catch (error) {
    console.error("Error tracking product view:", error);
    // Suppress error, don't let activity tracking break the app
  }
};

/**
 * Track competition view
 * @param {number} competitionId - The ID of the competition being viewed
 * @param {string} competitionName - The name of the competition
 * @returns {Promise<void>}
 */
export const trackCompetitionView = async (competitionId, competitionName) => {
  // Skip if tracking is disabled globally
  if (!ACTIVITY_TRACKING_ENABLED) return;

  try {
    await trackActivity({
      type: ActivityTypeEnum.CompetitionView,
      description: `Viewed competition: ${
        competitionName || "Unknown competition"
      }`,
      relatedEntityType: "Competition",
      relatedEntityId: competitionId,
    });
  } catch (error) {
    console.error("Error tracking competition view:", error);
    // Suppress error, don't let activity tracking break the app
  }
};

/**
 * Track blog article view
 * @param {number} articleId - The ID of the article being viewed
 * @param {string} articleTitle - The title of the article
 * @returns {Promise<void>}
 */
export const trackBlogArticleView = async (articleId, articleTitle) => {
  // Skip if tracking is disabled globally
  if (!ACTIVITY_TRACKING_ENABLED) return;

  try {
    await trackActivity({
      type: ActivityTypeEnum.BlogArticleView,
      description: `Viewed article: ${articleTitle || "Unknown article"}`,
      relatedEntityType: "BlogArticle",
      relatedEntityId: articleId,
    });
  } catch (error) {
    console.error("Error tracking blog article view:", error);
    // Suppress error, don't let activity tracking break the app
  }
};

/**
 * Track profile update
 * @param {string} updateType - The type of profile update (bio, picture, etc.)
 * @returns {Promise<void>}
 */
export const trackProfileUpdate = async (updateType) => {
  // Skip if tracking is disabled globally
  if (!ACTIVITY_TRACKING_ENABLED) return;

  try {
    let activityType;
    switch (updateType.toLowerCase()) {
      case "bio":
        activityType = ActivityTypeEnum.BioUpdate;
        break;
      case "picture":
      case "profilepicture":
      case "avatar":
        activityType = ActivityTypeEnum.ProfilePictureUpdate;
        break;
      default:
        activityType = ActivityTypeEnum.ProfileUpdate;
    }

    await trackActivity({
      type: activityType,
      description: `Updated profile ${updateType}`,
    });
  } catch (error) {
    console.error("Error tracking profile update:", error);
    // Suppress error, don't let activity tracking break the app
  }
};

export default {
  trackActivity,
  trackPageView,
  trackProductView,
  trackCompetitionView,
  trackBlogArticleView,
  trackProfileUpdate,
  setActivityTrackingEnabled,
  setEnabled,
  resetCircuitBreaker,
  clearQueue,
  debug,
};
