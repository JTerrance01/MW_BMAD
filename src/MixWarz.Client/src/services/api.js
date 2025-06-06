import axios from "axios";

// Define API base URL - hardcoded for development
const API_BASE_URL = "https://localhost:7001";
console.log(`Using API base URL: ${API_BASE_URL}`);

// Track connection status
let serverConnected = false;
let connectionCheckInProgress = false;

// Function to test API connectivity
export const checkApiConnection = async () => {
  try {
    connectionCheckInProgress = true;
    console.log("Checking API connection...");

    // Make a simple request to the health endpoint or any public endpoint
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 5000,
      withCredentials: false,
    });

    serverConnected = response.status >= 200 && response.status < 300;
    console.log(
      `API connection check: ${serverConnected ? "Connected" : "Failed"}`
    );

    return serverConnected;
  } catch (error) {
    console.error("API connection check failed:", error.message);
    serverConnected = false;

    // Show a user-friendly error message in the console
    console.warn(`
      ⚠️ Cannot connect to API server at ${API_BASE_URL}
      
      Please check:
      1. API server is running (cd src/MixWarz.API && dotnet run)
      2. No firewall is blocking connections
      3. The API URL is correct in API_BASE_URL
      4. Browser console for CORS or certificate errors
    `);

    return false;
  } finally {
    connectionCheckInProgress = false;
  }
};

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increase timeout to 60 seconds for regular requests
  // Don't set Content-Type globally to allow it to be set correctly for each request type
  // headers: {
  //   "Content-Type": "application/json",
  // },
  // Ensure cookies and auth headers are sent
  withCredentials: true,
});

// Create a specialized instance for activity tracking with credentials
export const activityApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Increased timeout for better reliability
  headers: {
    "Content-Type": "application/json",
    "X-Activity-Tracking": "true", // Always include this header
  },
  // Simplified CORS handling - don't include credentials by default to avoid CORS issues
  withCredentials: false,
});

// Debug interceptor for the activity API
activityApi.interceptors.request.use((config) => {
  console.log(
    `🔍 Activity API Request: ${config.method.toUpperCase()} ${config.baseURL}${
      config.url
    }`
  );

  // Don't use credentials for activity tracking to avoid CORS issues
  config.withCredentials = false;

  // Ensure origin header is properly handled
  if (typeof window !== "undefined") {
    // Allow detection of cross-origin requests
    console.log(`Origin: ${window.location.origin}, Target: ${config.baseURL}`);
  }

  return config;
});

activityApi.interceptors.response.use(
  (response) => {
    serverConnected = true; // Mark as connected on successful response
    console.log(`✅ Activity API Response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ Activity API Error:`, error.message);
    
    // Log more details for debugging
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else if (error.request) {
      console.error(`No response received:`, error.request);
    }
    
    // Don't redirect to login for activity tracking errors
    return Promise.reject(error);
  }
);

// Debug interceptor - log all requests for debugging
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");

  // Check if the data is FormData and handle it properly
  const isFormData = config.data instanceof FormData;

  // Special case for FormData - let browser set the correct multipart boundary
  if (isFormData) {
    // For FormData, we must remove the Content-Type header
    // to let the browser set the proper multipart boundary
    delete config.headers["Content-Type"];
    console.log(
      "FormData detected - removed Content-Type header to allow browser to set boundary"
    );
  }
  // Set default content type if not FormData and not already set
  else if (
    !config.headers["Content-Type"] &&
    !config.headers.hasOwnProperty("Content-Type")
  ) {
    // Default to application/json for regular requests
    config.headers["Content-Type"] = "application/json";
  }

  console.log(
    `🔍 API Request: ${config.method.toUpperCase()} ${config.baseURL}${
      config.url
    } | FormData: ${isFormData}`
  );
  console.log(`Auth token present: ${!!token}`);

  // If we're not already checking connection and we haven't confirmed connection yet
  if (
    !serverConnected &&
    !connectionCheckInProgress &&
    !config.url.includes("/health")
  ) {
    try {
      await checkApiConnection();
    } catch (e) {
      // Allow the request to proceed even if connection check fails
      console.warn("Connection check failed, proceeding with request anyway");
    }
  }

  return config;
});

// Request interceptor for adding auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Basic token structure check
        const parts = token.split(".");
        if (parts.length !== 3) {
          console.error("TOKEN INVALID: Not a valid JWT structure");
          localStorage.removeItem("token"); // Remove invalid token
          return config; // Continue without token
        }

        // Check expiration
        try {
          const payload = JSON.parse(atob(parts[1]));
          if (!payload.exp) {
            console.error("TOKEN INVALID: No expiration claim");
            return config; // Continue, but token may be rejected
          }

          const expiry = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();

          if (expiry < now) {
            console.error("TOKEN EXPIRED! Removing from storage.");
            localStorage.removeItem("token");
            return config; // Continue request without token
          }
        } catch (parseError) {
          console.error("Error parsing token payload:", parseError);
          // Continue without token validation
        }

        // Token structure looks valid, add it to the request
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.error("Error processing token:", e);
        // Don't add the token if we can't parse it
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiry
api.interceptors.response.use(
  (response) => {
    serverConnected = true; // Mark as connected on successful response
    console.log(`✅ API Response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error:`, error);

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      serverConnected = true; // We got a response, so server is connected

      // Handle authentication errors
      if (error.response.status === 401) {
        // Remove invalid token
        localStorage.removeItem("token");
        console.warn("Auth token removed due to 401 response");

        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/login?expired=true";
        }, 100);
      }
    } else if (error.request) {
      console.error(`No response received`);
      serverConnected = false; // Mark as disconnected

      // Log the connection issue to console only, don't show UI error
      console.warn(`
        API Connection Warning:
        - No response received from ${API_BASE_URL}
        - Check if the API server is running
        - This warning is logged to console only
      `);
    } else {
      console.error(`Request setup error:`, error.message);
    }

    return Promise.reject(error);
  }
);

// Create a specialized instance for file uploads with longer timeout
export const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for file uploads
  withCredentials: true,
});

// Add the same interceptors to the upload API
uploadApi.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");

  // Check if the data is FormData and handle it properly
  const isFormData = config.data instanceof FormData;

  // Special case for FormData - let browser set the correct multipart boundary
  if (isFormData) {
    // For FormData, we must remove the Content-Type header
    // to let the browser set the proper multipart boundary
    delete config.headers["Content-Type"];
    console.log(
      "FormData detected - removed Content-Type header to allow browser to set boundary"
    );
  }

  console.log(
    `🔍 Upload API Request: ${config.method.toUpperCase()} ${config.baseURL}${
      config.url
    } | FormData: ${isFormData}`
  );
  console.log(`Auth token present: ${!!token}`);

  // Add auth token if available
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

uploadApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Upload API Response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ Upload API Error:`, error);
    return Promise.reject(error);
  }
);

// Export the connection check function for use elsewhere
export const isServerConnected = () => serverConnected;

// Run a connection check when the module is imported
checkApiConnection().catch((err) =>
  console.warn("Initial connection check failed:", err.message)
);

export default api;
