import api from "./api";
import {
  formatApiError,
  handleApiError,
  ErrorTypes,
} from "../utils/errorHandling";

/**
 * Helper function to delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Comprehensive API service with built-in error handling
 *
 * This service wraps all API calls with standardized error handling logic
 * and provides methods for common API operations (GET, POST, PUT, DELETE)
 */
class ApiService {
  /**
   * Make a GET request with error handling
   * @param {string} endpoint - API endpoint to call
   * @param {Object} params - URL parameters
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, params = {}, options = {}) {
    const {
      errorContext = endpoint,
      retry = false,
      maxRetries = 2,
      retryDelay = 1000,
      ...axiosOptions
    } = options;

    let attempts = 0;
    let lastError = null;

    while (attempts <= maxRetries) {
      try {
        console.log(
          `[API] GET request to ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          { params }
        );
        const response = await api.get(endpoint, {
          params,
          ...axiosOptions,
        });
        console.log(`[API] GET response from ${endpoint}`, response.data);
        return response.data;
      } catch (error) {
        console.error(
          `[API] GET request failed for ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          error
        );
        lastError = error;

        // Check if we should retry
        if (retry && attempts < maxRetries) {
          attempts++;
          console.log(
            `Retrying in ${retryDelay}ms... (${attempts}/${maxRetries})`
          );
          await delay(retryDelay);
          continue;
        }

        return this.handleRequestError(error, errorContext);
      }
    }

    // This should never be reached due to the return in the catch block
    return this.handleRequestError(lastError, errorContext);
  }

  /**
   * Make a POST request with error handling
   * @param {string} endpoint - API endpoint to call
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = {}, options = {}) {
    const {
      errorContext = endpoint,
      retry = false,
      maxRetries = 2,
      retryDelay = 1000,
      ...axiosOptions
    } = options;

    let attempts = 0;
    let lastError = null;

    while (attempts <= maxRetries) {
      try {
        console.log(
          `[API] POST request to ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          {
            data: data instanceof FormData ? "(FormData)" : data,
          }
        );
        const response = await api.post(endpoint, data, axiosOptions);
        console.log(`[API] POST response from ${endpoint}`, response.data);
        return response.data;
      } catch (error) {
        console.error(
          `[API] POST request failed for ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          error
        );
        lastError = error;

        // Check if we should retry
        if (retry && attempts < maxRetries) {
          attempts++;
          console.log(
            `Retrying in ${retryDelay}ms... (${attempts}/${maxRetries})`
          );
          await delay(retryDelay);
          continue;
        }

        return this.handleRequestError(error, errorContext);
      }
    }

    return this.handleRequestError(lastError, errorContext);
  }

  /**
   * Make a PUT request with error handling
   * @param {string} endpoint - API endpoint to call
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = {}, options = {}) {
    const {
      errorContext = endpoint,
      retry = false,
      maxRetries = 2,
      retryDelay = 1000,
      ...axiosOptions
    } = options;

    let attempts = 0;
    let lastError = null;

    while (attempts <= maxRetries) {
      try {
        console.log(
          `[API] PUT request to ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          { data }
        );
        const response = await api.put(endpoint, data, axiosOptions);
        console.log(`[API] PUT response from ${endpoint}`, response.data);
        return response.data;
      } catch (error) {
        console.error(
          `[API] PUT request failed for ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          error
        );
        lastError = error;

        // Check if we should retry
        if (retry && attempts < maxRetries) {
          attempts++;
          console.log(
            `Retrying in ${retryDelay}ms... (${attempts}/${maxRetries})`
          );
          await delay(retryDelay);
          continue;
        }

        return this.handleRequestError(error, errorContext);
      }
    }

    return this.handleRequestError(lastError, errorContext);
  }

  /**
   * Make a DELETE request with error handling
   * @param {string} endpoint - API endpoint to call
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    const {
      errorContext = endpoint,
      retry = false,
      maxRetries = 2,
      retryDelay = 1000,
      ...axiosOptions
    } = options;

    let attempts = 0;
    let lastError = null;

    while (attempts <= maxRetries) {
      try {
        console.log(
          `[API] DELETE request to ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`
        );
        const response = await api.delete(endpoint, axiosOptions);
        console.log(`[API] DELETE response from ${endpoint}`, response.data);
        return response.data;
      } catch (error) {
        console.error(
          `[API] DELETE request failed for ${endpoint}${
            attempts > 0 ? ` (Attempt ${attempts + 1}/${maxRetries + 1})` : ""
          }`,
          error
        );
        lastError = error;

        // Check if we should retry
        if (retry && attempts < maxRetries) {
          attempts++;
          console.log(
            `Retrying in ${retryDelay}ms... (${attempts}/${maxRetries})`
          );
          await delay(retryDelay);
          continue;
        }

        return this.handleRequestError(error, errorContext);
      }
    }

    return this.handleRequestError(lastError, errorContext);
  }

  /**
   * Upload a file with proper FormData handling and error management
   * @param {string} endpoint - API endpoint for the upload
   * @param {File} file - The file to upload
   * @param {Object} additionalData - Additional form data to include
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  async uploadFile(endpoint, file, additionalData = {}, options = {}) {
    const {
      errorContext = "File Upload",
      onProgress,
      fileFieldName = "file", // Default field name
      headers = {},
      ...axiosOptions
    } = options;

    // Create FormData and append the file
    const formData = new FormData();

    // Use the field name provided in options
    console.log(
      `[API] Appending file to FormData with field name: '${fileFieldName}'`
    );
    formData.append(fileFieldName, file);

    // Add any additional form fields
    Object.entries(additionalData).forEach(([key, value]) => {
      console.log(
        `[API] Adding additional field to FormData: ${key} = ${value}`
      );
      formData.append(key, value);
    });

    try {
      // Set up progress tracking if requested
      const uploadOptions = {
        ...axiosOptions,
        headers: {
          ...headers,
          // Don't explicitly set Content-Type for FormData - let the browser set it with the boundary
          Accept: "application/json",
        },
      };

      if (onProgress && typeof onProgress === "function") {
        uploadOptions.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted, progressEvent);
        };
      }

      console.log(`[API] Uploading file to ${endpoint}`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fieldName: fileFieldName,
        additionalData: JSON.stringify(additionalData),
      });

      // Debug: Log form data entries for debugging
      console.log("[API] FormData contents:");
      formData.forEach((value, key) => {
        console.log(
          `> ${key}: ${value instanceof File ? `File: ${value.name}` : value}`
        );
      });

      const response = await api.post(endpoint, formData, uploadOptions);
      console.log(`[API] Upload response from ${endpoint}`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[API] File upload failed for ${endpoint}`, error);

      // Enhanced error logging
      if (error.response) {
        console.error(
          `[API] Server responded with status: ${error.response.status}`
        );
        console.error(`[API] Response data:`, error.response.data);
      } else if (error.request) {
        console.error(`[API] Request was made but no response received`);
      } else {
        console.error(`[API] Error setting up request:`, error.message);
      }

      return this.handleRequestError(error, errorContext);
    }
  }

  /**
   * Download a file with proper response handling and error management
   * @param {string} endpoint - API endpoint for the download
   * @param {Object} params - URL parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Blob>} File blob
   */
  async downloadFile(endpoint, params = {}, options = {}) {
    const {
      errorContext = "File Download",
      filename = "download",
      onProgress,
      ...axiosOptions
    } = options;

    try {
      // Set up response type and progress tracking
      const downloadOptions = {
        ...axiosOptions,
        responseType: "blob",
        params,
      };

      if (onProgress && typeof onProgress === "function") {
        downloadOptions.onDownloadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted, progressEvent);
        };
      }

      console.log(`[API] Downloading file from ${endpoint}`);
      const response = await api.get(endpoint, downloadOptions);

      // Extract filename from content-disposition if available
      let downloadFilename = filename;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", downloadFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log(`[API] File download complete: ${downloadFilename}`);
      return response.data;
    } catch (error) {
      console.error(`[API] File download failed for ${endpoint}`, error);
      return this.handleRequestError(error, errorContext);
    }
  }

  /**
   * Check if the error is related to HTTPS certificate or connection issues
   * @private
   * @param {Error} error - The error to check
   * @returns {boolean} True if it's a connection or certificate issue
   */
  isConnectionOrCertificateError(error) {
    const isNetworkError = !error.response && error.request;
    const errorMessage = error.message ? error.message.toLowerCase() : "";

    return (
      isNetworkError ||
      errorMessage.includes("network error") ||
      errorMessage.includes("certificate") ||
      errorMessage.includes("ssl") ||
      errorMessage.includes("failed to fetch")
    );
  }

  /**
   * Handle API request errors with standardized processing
   * @private
   * @param {Error} error - The original error
   * @param {string} context - Context for error logging
   * @throws {Error} Rethrows the formatted error
   */
  handleRequestError(error, context) {
    // Check for connection/certificate issues first
    if (this.isConnectionOrCertificateError(error)) {
      console.error(`Connection error in ${context}:`, error);

      // Enhanced error message for HTTPS certificate issues
      let message = "Failed to connect to the server.";

      // Check for specific error patterns
      if (
        error.message &&
        (error.message.toLowerCase().includes("certificate") ||
          error.message.toLowerCase().includes("ssl"))
      ) {
        message =
          "SSL/HTTPS certificate issue detected. Please try accessing https://localhost:7001 directly in your browser and accept any security warnings.";
      }

      return {
        success: false,
        message,
        error: {
          type: "CONNECTION_ERROR",
          originalError: error,
          context,
        },
      };
    }

    // Format and log the error
    const formattedError = formatApiError(error);
    console.error(`Error in ${context}:`, formattedError);

    // For authentication errors, don't throw to let the app redirect to login
    if (formattedError.type === ErrorTypes.AUTHENTICATION) {
      return {
        success: false,
        message: formattedError.message,
        error: formattedError,
      };
    }

    // Return a standardized error object for all other errors
    // This is easier to handle in components than throwing
    return {
      success: false,
      message: formattedError.message || "An unexpected error occurred",
      error: formattedError,
    };
  }
}

// Export a singleton instance
export default new ApiService();
