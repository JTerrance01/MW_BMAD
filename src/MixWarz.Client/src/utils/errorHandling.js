/**
 * MixWarz API Error Handling Utilities
 * This module provides standardized error handling for API calls across the application.
 */

/**
 * Export error types for consistent typechecking across the app
 */
export const ErrorTypes = {
  AUTHENTICATION: "AUTHENTICATION", // 401 Unauthorized
  AUTHORIZATION: "AUTHORIZATION", // 403 Forbidden
  VALIDATION: "VALIDATION", // 400 Bad Request with validation errors
  NOT_FOUND: "NOT_FOUND", // 404 Not Found
  SERVER: "SERVER", // 500 Internal Server Error
  TIMEOUT: "TIMEOUT", // Request timeout
  NETWORK: "NETWORK", // Network connection issues
  UNEXPECTED: "UNEXPECTED", // Any other unexpected errors
};

/**
 * Maps HTTP status codes to error types
 * @param {number} status - HTTP status code
 * @returns {string} Error type
 */
export const mapStatusToErrorType = (status) => {
  switch (status) {
    case 400:
      return ErrorTypes.VALIDATION;
    case 401:
      return ErrorTypes.AUTHENTICATION;
    case 403:
      return ErrorTypes.AUTHORIZATION;
    case 404:
      return ErrorTypes.NOT_FOUND;
    case 408:
      return ErrorTypes.TIMEOUT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorTypes.SERVER;
    default:
      if (status >= 500) return ErrorTypes.SERVER;
      return ErrorTypes.UNEXPECTED;
  }
};

/**
 * Checks if an error is related to certificate issues
 * @param {string} message - Error message
 * @returns {boolean} True if certificate related
 */
const isCertificateError = (message) => {
  if (!message) return false;

  const lowerMsg = message.toLowerCase();
  return (
    lowerMsg.includes("certificate") ||
    lowerMsg.includes("ssl") ||
    lowerMsg.includes("cert") ||
    lowerMsg.includes("self signed") ||
    lowerMsg.includes("unable to verify")
  );
};

/**
 * Formats an API error for consistent handling
 * @param {Error|Object} error - The error object
 * @returns {Object} A formatted error object
 */
export const formatApiError = (error) => {
  // If it's already in our format, return it
  if (error && error.type && Object.values(ErrorTypes).includes(error.type)) {
    return error;
  }

  // Create base error structure
  const formattedError = {
    message: "An unexpected error occurred",
    type: ErrorTypes.UNEXPECTED,
    status: null,
    timestamp: new Date().toISOString(),
    details: null,
    validationErrors: null,
    originalError: error,
  };

  // Handle network errors
  if (!error) {
    formattedError.message = "Unknown error occurred";
    return formattedError;
  }

  // Extract error message
  if (typeof error === "string") {
    formattedError.message = error;
    return formattedError;
  }

  // Handle axios errors
  if (error.isAxiosError) {
    const { response, request, message, code } = error;

    // Response errors (server responded with error)
    if (response) {
      formattedError.status = response.status;
      formattedError.type = mapStatusToErrorType(response.status);

      // Extract error details from response
      const data = response.data;
      formattedError.message =
        data?.message || data?.title || message || "Server error";
      formattedError.details = data?.details || data?.errors || null;

      // Handle validation errors (extract field-specific errors)
      if (formattedError.type === ErrorTypes.VALIDATION && data?.errors) {
        formattedError.validationErrors = data.errors;
      }
    }
    // Network errors (no response received)
    else if (request) {
      formattedError.type = ErrorTypes.NETWORK;

      if (code === "ECONNABORTED") {
        formattedError.type = ErrorTypes.TIMEOUT;
        formattedError.message = "Request timed out. Please try again.";
      } else if (isCertificateError(message)) {
        formattedError.message =
          "Security certificate issue. Please check your connection.";
      } else {
        formattedError.message = "Network error. Please check your connection.";
      }
    }
  }
  // Generic error handling
  else if (error instanceof Error) {
    formattedError.message = error.message || "An error occurred";
    // Check for network-related errors
    if (
      error.name === "NetworkError" ||
      error.message.includes("network") ||
      error.message.includes("connection")
    ) {
      formattedError.type = ErrorTypes.NETWORK;
    }
  }

  return formattedError;
};

/**
 * Extracts validation errors from an API error response
 * @param {Object} apiError - The formatted API error
 * @returns {Object|null} Validation errors object or null if not present
 */
export const extractValidationErrors = (apiError) => {
  if (!apiError) return null;

  // Return validation errors if already extracted
  if (apiError.validationErrors) {
    return apiError.validationErrors;
  }

  // Try to extract from error details
  if (apiError.details && typeof apiError.details === "object") {
    // ASP.NET Core format
    if (apiError.details.errors) {
      return apiError.details.errors;
    }

    // Already flat object of field errors
    if (Object.keys(apiError.details).length > 0) {
      const firstKey = Object.keys(apiError.details)[0];
      // Check if value is an array or string (indication of field error)
      if (
        Array.isArray(apiError.details[firstKey]) ||
        typeof apiError.details[firstKey] === "string"
      ) {
        return apiError.details;
      }
    }
  }

  // No validation errors found
  return null;
};

/**
 * Gets a user-friendly error message based on error type and details
 * @param {Object} apiError - The formatted API error
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (apiError) => {
  if (!apiError) return "An unknown error occurred";

  switch (apiError.type) {
    case ErrorTypes.AUTHENTICATION:
      return "Your session has expired or you're not logged in. Please sign in again.";

    case ErrorTypes.AUTHORIZATION:
      return "You don't have permission to perform this action.";

    case ErrorTypes.VALIDATION:
      if (apiError.validationErrors) {
        // If we have specific validation errors, create a more helpful message
        return "There were validation errors with your request. Please check the form and try again.";
      }
      return apiError.message || "Please check your input and try again.";

    case ErrorTypes.NOT_FOUND:
      return "The requested resource was not found.";

    case ErrorTypes.NETWORK:
      return "Unable to connect to the server. Please check your internet connection.";

    case ErrorTypes.TIMEOUT:
      return "The request timed out. Please try again later.";

    case ErrorTypes.SERVER:
      return "The server encountered an error. Please try again later.";

    default:
      return (
        apiError.message || "An unexpected error occurred. Please try again."
      );
  }
};

/**
 * Logs an API error with context for debugging
 * @param {Object} apiError - The formatted API error
 * @param {string} context - Context where the error occurred
 */
export const logApiError = (apiError, context = "API Error") => {
  if (!apiError) {
    console.error(`${context}: Unknown error`);
    return;
  }

  // Log appropriate level based on error type
  const { type, message, status, details, validationErrors, originalError } =
    apiError;

  const logData = {
    context,
    type,
    message,
    status,
    details,
    validationErrors,
  };

  // Only log the entire error object in development
  if (process.env.NODE_ENV === "development") {
    logData.originalError = originalError;
  }

  if (type === ErrorTypes.NETWORK || type === ErrorTypes.TIMEOUT) {
    console.warn(`${context}:`, logData);
  } else if (type === ErrorTypes.SERVER) {
    console.error(`${context}:`, logData);
  } else if (type === ErrorTypes.VALIDATION) {
    console.info(`${context} - Validation Error:`, logData);
  } else {
    console.error(`${context}:`, logData);
  }
};

/**
 * Determines if an error should trigger a redirect
 * @param {Object} apiError - The formatted API error
 * @returns {Object|null} Redirect info or null if no redirect needed
 */
export const getErrorRedirect = (apiError) => {
  if (!apiError) return null;

  switch (apiError.type) {
    case ErrorTypes.AUTHENTICATION:
      return {
        path: "/login",
        message: "Your session has expired. Please sign in again.",
      };

    case ErrorTypes.AUTHORIZATION:
      return {
        path: "/",
        message: "You don't have permission to access that page.",
      };

    case ErrorTypes.NOT_FOUND:
      return {
        path: "/not-found",
        message: "The requested resource was not found.",
      };

    default:
      return null;
  }
};

/**
 * Centralized error handler that performs all common error handling steps
 * @param {Error|Object} error - The original error
 * @param {Object} options - Options for error handling
 * @returns {Object} The formatted error
 */
export const handleApiError = (error, options = {}) => {
  const {
    context = "API Error",
    suppressLogging = false,
    suppressRedirect = false,
    onAuthentication = null,
    onRedirect = null,
  } = options;

  // Format the error
  const formattedError = formatApiError(error);

  // Log the error unless suppressed
  if (!suppressLogging) {
    logApiError(formattedError, context);
  }

  // Handle authentication errors
  if (
    formattedError.type === ErrorTypes.AUTHENTICATION &&
    typeof onAuthentication === "function"
  ) {
    onAuthentication(formattedError);
  }

  // Handle redirects
  if (!suppressRedirect) {
    const redirect = getErrorRedirect(formattedError);
    if (redirect && typeof onRedirect === "function") {
      onRedirect(redirect);
    }
  }

  return formattedError;
};

/**
 * Higher-order function that wraps an API call with error handling
 * @param {Function} apiFn - The API function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (apiFn, options = {}) => {
  return async (...args) => {
    try {
      return await apiFn(...args);
    } catch (error) {
      return handleApiError(error, options);
    }
  };
};

/**
 * Creates a reusable error handler function that can be used throughout the app
 * @param {Object} defaultOptions - Default error handling options
 * @returns {Object} Error handling utilities
 */
export const createErrorHandler = (defaultOptions = {}) => {
  /**
   * Handle API errors consistently
   * @param {Error} error - The error to handle
   * @param {Object} options - Options to override defaults
   * @returns {Object} Formatted error
   */
  const handle = (error, options = {}) => {
    return handleApiError(error, { ...defaultOptions, ...options });
  };

  /**
   * Wrap an API function with standardized error handling
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Options to override defaults
   * @returns {Function} Wrapped function with error handling
   */
  const wrap = (fn, options = {}) => {
    return withErrorHandling(fn, { ...defaultOptions, ...options });
  };

  /**
   * Create an API call wrapper with error handling that returns a tuple [data, error]
   * @param {Function} apiFn - API function to call
   * @param {Object} options - Error handling options
   * @returns {Promise<[any, null]|[null, Object]>} Tuple of [data, error]
   */
  const safeCall = async (apiFn, ...args) => {
    try {
      const result = await apiFn(...args);
      return [result, null];
    } catch (error) {
      const formattedError = handle(error);
      return [null, formattedError];
    }
  };

  return {
    formatError: formatApiError,
    handle,
    wrap,
    safeCall,
    getErrorMessage: getUserFriendlyMessage,
    getValidationErrors: extractValidationErrors,
    getRedirect: getErrorRedirect,
  };
};
