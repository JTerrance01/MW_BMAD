import api, { activityApi } from "./api";

// Get the base URL from the same place api.js uses
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://localhost:7001";

// Map of string activity types to numeric enum values - MUST match backend ActivityType enum exactly
const ActivityTypeEnum = {
  Login: 0,
  Logout: 1, 
  ProfileUpdate: 2,
  ProfilePictureUpdate: 3,
  BioUpdate: 4,
  CompetitionView: 5,
  CompetitionSubmission: 6,
  CompetitionJudging: 7,
  ProductView: 8,
  ProductPurchase: 9,
  CartUpdate: 10,
  OrderPlacement: 11,
  OrderCompletion: 12,
  BlogArticleView: 13,
  BlogCommentCreate: 14,
  BlogCommentReply: 15,
  ForumTopicCreate: 16,
  ForumReply: 17,
  PageView: 18,
  DownloadResource: 19,
};

// Export the enum for use in other files
export { ActivityTypeEnum };

const API_URL = "/api/UserActivity";

// Queue for storing failed activities to retry later
let activityQueue = [];

// Try to load saved queue from localStorage
try {
  const savedQueue = localStorage.getItem("mixwarz_activity_queue");
  if (savedQueue) {
    activityQueue = JSON.parse(savedQueue);
    console.log(
      `[Activity] Loaded ${activityQueue.length} pending activities from storage`
    );
  }
} catch (e) {
  console.warn("[Activity] Failed to load activity queue from storage:", e);
}

// Function to save queue to localStorage
const saveQueue = () => {
  try {
    localStorage.setItem(
      "mixwarz_activity_queue",
      JSON.stringify(activityQueue)
    );
  } catch (e) {
    console.warn("[Activity] Failed to save activity queue to storage:", e);
  }
};

// Function to process the queue
const processQueue = async () => {
  if (activityQueue.length === 0) return;

  console.log(
    `[Activity] Processing ${activityQueue.length} pending activities`
  );

  const MAX_BATCH_SIZE = 3;
  const batch = activityQueue.slice(0, MAX_BATCH_SIZE);

  for (const activity of batch) {
    try {
      console.log(`[Activity] Retrying activity: ${activity.type}`);
      await sendActivityRequest(activity);

      // Remove from queue if successful
      activityQueue = activityQueue.filter((a) => a !== activity);
      saveQueue();
    } catch (error) {
      console.warn(`[Activity] Failed to process queued activity:`, error);
      // Leave in queue for next attempt
      break; // Stop processing if we hit an error
    }
  }
};

/**
 * Validate and sanitize activity data
 * @param {Object} activityData - The activity data to validate
 * @returns {Object} Sanitized activity data
 */
const validateActivityData = (activityData) => {
  if (!activityData) {
    throw new Error("Activity data is required");
  }

  if (!activityData.type) {
    throw new Error("Activity type is required");
  }

  // Convert string activity type to numeric enum value if needed
  let numericType;
  if (typeof activityData.type === "string") {
    numericType = ActivityTypeEnum[activityData.type];
    if (numericType === undefined) {
      throw new Error(`Invalid activity type: ${activityData.type}. Valid types: ${Object.keys(ActivityTypeEnum).join(', ')}`);
    }
  } else if (typeof activityData.type === "number") {
    // Validate that the number is a valid enum value
    const validValues = Object.values(ActivityTypeEnum);
    if (!validValues.includes(activityData.type)) {
      throw new Error(`Invalid activity type number: ${activityData.type}. Valid values: ${validValues.join(', ')}`);
    }
    numericType = activityData.type;
  } else {
    throw new Error(`Activity type must be string or number, got ${typeof activityData.type}`);
  }

  // Create sanitized payload matching the C# API expectations (PascalCase)
  const sanitized = {
    Type: numericType,
    Description: activityData.description || `${Object.keys(ActivityTypeEnum).find(key => ActivityTypeEnum[key] === numericType)} activity`,
  };

  // Only include optional fields if they have valid values
  if (activityData.relatedEntityType && activityData.relatedEntityType.trim() !== "") {
    sanitized.RelatedEntityType = activityData.relatedEntityType.trim();
  }

  if (activityData.relatedEntityId !== undefined && activityData.relatedEntityId !== null) {
    // Convert string to number if needed
    if (typeof activityData.relatedEntityId === "string") {
      const parsedId = parseInt(activityData.relatedEntityId, 10);
      if (!isNaN(parsedId)) {
        sanitized.RelatedEntityId = parsedId;
      } else {
        console.warn(`Invalid relatedEntityId (not a number): ${activityData.relatedEntityId}`);
      }
    } else if (typeof activityData.relatedEntityId === "number") {
      sanitized.RelatedEntityId = activityData.relatedEntityId;
    }
  }

  console.log("[Activity] Sanitized payload:", sanitized);
  return sanitized;
};

// Function to actually send the request - simplified and fixed
const sendActivityRequest = async (payload) => {
  const endpoint = "/api/UserActivity/anonymous-track"; // Fixed: use relative path
  
  console.log(`[Activity] Sending to endpoint: ${endpoint}`);
  console.log("[Activity] Payload:", JSON.stringify(payload, null, 2));

  try {
    // Use the activityApi instance with proper error handling
    const response = await activityApi.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Activity-Client": "ReactApp",
        "X-Activity-Timestamp": new Date().toISOString(),
      },
      timeout: 10000, // 10 second timeout
    });

    console.log("[Activity] Success response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[Activity] Request failed:", error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error("[Activity] Error status:", error.response.status);
      console.error("[Activity] Error data:", error.response.data);
      console.error("[Activity] Error headers:", error.response.headers);
    } else if (error.request) {
      console.error("[Activity] No response received:", error.request);
    }
    
    // For debugging: try a simple fetch as fallback
    try {
      console.log("[Activity] Trying fetch API as fallback...");
      const fetchResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Note: Not using credentials to avoid CORS issues for now
      });
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`);
      }
      
      const data = await fetchResponse.json();
      console.log("[Activity] Fetch fallback succeeded:", data);
      return data;
    } catch (fetchError) {
      console.error("[Activity] Fetch fallback also failed:", fetchError.message);
      throw error; // Throw the original error
    }
  }
};

/**
 * Main function to track user activity
 * @param {Object} activityData - Activity data to track
 * @param {string|number} activityData.type - Activity type from ActivityType enum
 * @param {string} [activityData.description] - Optional description of the activity
 * @param {string} [activityData.relatedEntityType] - Optional related entity type
 * @param {string|number} [activityData.relatedEntityId] - Optional related entity ID
 * @returns {Promise<number|void>} The activity ID or void if tracking fails
 */
export const trackActivity = async (activityData) => {
  try {
    console.log("[Activity] trackActivity called with:", activityData);
    
    // Validate and sanitize the activity data
    const sanitizedPayload = validateActivityData(activityData);
    
    // Send the request
    const result = await sendActivityRequest(sanitizedPayload);
    
    console.log("[Activity] Activity tracked successfully:", result);
    return result?.activityId || result?.id;
  } catch (error) {
    console.error("[Activity] Failed to track activity:", error.message);
    
    // Add to queue for retry later
    try {
      activityQueue.push({
        ...activityData,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
      saveQueue();
      console.log("[Activity] Added failed activity to retry queue");
    } catch (queueError) {
      console.warn("[Activity] Failed to add to retry queue:", queueError);
    }
    
    // Don't throw error to avoid breaking the user experience
    return undefined;
  }
};

/**
 * Fetch data from an activity endpoint with multiple fallback strategies
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<any>} Response data
 */
const fetchActivityData = async (endpoint, params = {}) => {
  console.log(`[Activity] Fetching from ${endpoint} with params:`, params);

  // First try using the standard API client
  try {
    const response = await api.get(`${API_URL}/${endpoint}`, {
      params,
    });
    return response.data;
  } catch (axiosError) {
    console.warn(
      `[Activity] Standard API client failed for ${endpoint}, trying activityApi:`,
      axiosError.message
    );

    // Try with the activity-specific client that doesn't send credentials
    try {
      const corsResponse = await activityApi.get(`${API_URL}/${endpoint}`, {
        params,
      });
      return corsResponse.data;
    } catch (activityApiError) {
      console.warn(
        `[Activity] ActivityApi client failed, trying fetch API:`,
        activityApiError.message
      );

      // Last resort - try with plain fetch API
      const url = new URL(`${API_BASE_URL}${API_URL}/${endpoint}`);
      // Add query parameters to URL
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
      );

      const fetchResponse = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Activity-Client": "ReactApp-Fetch",
          "X-Activity-Tracking": "true",
        },
        mode: "cors",
        credentials: "include", // Include credentials (cookies, HTTP auth)
      });

      if (!fetchResponse.ok) {
        throw new Error(`Fetch failed with status: ${fetchResponse.status}`);
      }

      return await fetchResponse.json();
    }
  }
};

// Function to get user activities with improved CORS handling
const getUserActivities = async (params) => {
  try {
    // Convert string activityType to numeric if provided
    const newParams = { ...params };
    if (
      newParams.activityType &&
      ActivityTypeEnum[newParams.activityType] !== undefined
    ) {
      newParams.activityType = ActivityTypeEnum[newParams.activityType];
    }

    return await fetchActivityData("activities", newParams);
  } catch (error) {
    console.error("[Activity] Failed to get user activities:", error);
    // Return a failsafe empty response
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
};

// Function to get user activity statistics
const getUserStatistics = async () => {
  try {
    return await fetchActivityData("statistics");
  } catch (error) {
    console.error("[Activity] Failed to get user statistics:", error);
    // Return a failsafe empty response
    return {
      totalActivities: 0,
      activityByType: {},
      activityByDay: {},
      recentActivity: [],
    };
  }
};

// Function to get current user info via the activity service
const getCurrentUser = async () => {
  try {
    return await fetchActivityData("me");
  } catch (error) {
    console.error("[Activity] Failed to get current user:", error);
    return {
      isAuthenticated: false,
      userId: "anonymous",
      username: "Guest",
    };
  }
};

// Export functions
export {
  getUserActivities,
  getUserStatistics,
  getCurrentUser,
  processQueue,
};
