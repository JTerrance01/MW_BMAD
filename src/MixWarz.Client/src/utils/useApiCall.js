import { useState, useCallback, useRef } from "react";
import { useError } from "./errorContext";

/**
 * Custom hook for making API calls with built-in error handling and loading state.
 *
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @param {boolean} options.useErrorContext - Whether to use the error context
 * @param {string} options.errorContext - Context name for error logging
 * @param {boolean} options.showErrorNotification - Whether to show error notification
 * @returns {Object} An object with loading state, error state, and a function to make the API call
 */
const useApiCall = (
  apiFunction,
  {
    useErrorContext = true,
    errorContext = "API Call",
    showErrorNotification = true,
  } = {}
) => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const abortControllerRef = useRef(null);
  const { handleError } = useError();

  // Function to cancel the current API call
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clear local error state
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  // Main function to call the API with error handling
  const callApi = useCallback(
    async (...args) => {
      // Cancel any existing request
      cancelRequest();

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      clearError();

      try {
        // Call the API function with the provided arguments and abort signal
        const result = await apiFunction(...args, { signal });
        return result;
      } catch (error) {
        // Check if the request was aborted
        if (error.name === "AbortError") {
          console.log("Request was cancelled");
          return;
        }

        // Handle the error
        if (useErrorContext) {
          // Use the global error handling
          handleError(error, {
            context: errorContext,
            // Store a callback that can retry this exact API call
            actionCallback: () => callApi(...args),
            showNotification: showErrorNotification,
          });
        } else {
          // Use local error state
          setLocalError(error);
        }

        // Re-throw the error so the caller can handle it if needed
        throw error;
      } finally {
        // Reset loading state only if the request wasn't aborted
        if (!signal.aborted) {
          setLoading(false);
        }

        // Clear the AbortController reference
        if (abortControllerRef.current === signal.controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      apiFunction,
      cancelRequest,
      clearError,
      handleError,
      useErrorContext,
      errorContext,
      showErrorNotification,
    ]
  );

  return {
    loading,
    error: localError,
    clearError,
    callApi,
    cancelRequest,
  };
};

export default useApiCall;
