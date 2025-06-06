import { useState, useCallback } from "react";
import useApiCall from "./useApiCall";
import { ErrorTypes, extractValidationErrors } from "./errorHandling";

/**
 * Custom hook for handling form submissions with API calls
 * Provides integrated validation error handling
 *
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Additional options
 * @returns {Object} Form submission utilities
 */
const useFormApiCall = (apiFunction, options = {}) => {
  const {
    errorContext = "Form Submission",
    onSuccess,
    onValidationError,
    initialFormErrors = {},
    ...apiCallOptions
  } = options;

  // Track form-specific validation errors
  const [formErrors, setFormErrors] = useState(initialFormErrors);
  const [submitCount, setSubmitCount] = useState(0);

  // Use our base API call hook
  const { loading, error, callApi, clearError } = useApiCall(apiFunction, {
    errorContext,
    ...apiCallOptions,
  });

  // Clear validation errors for a specific field
  const clearFieldError = useCallback((fieldName) => {
    setFormErrors((prev) => {
      if (!prev[fieldName]) return prev;

      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all form errors
  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  // Submit the form data
  const submitForm = useCallback(
    async (formData) => {
      // Clear previous errors
      clearFormErrors();
      clearError();

      // Increment submit count
      setSubmitCount((prev) => prev + 1);

      try {
        // Call the API
        const result = await callApi(formData);

        // Call success callback if provided
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        // Check if this is a validation error
        if (err.type === ErrorTypes.VALIDATION) {
          // Extract field-level validation errors
          const validationErrors = extractValidationErrors(err);

          if (validationErrors) {
            // Set form errors state
            setFormErrors(validationErrors);

            // Call validation error callback if provided
            if (onValidationError && typeof onValidationError === "function") {
              onValidationError(validationErrors, err);
            }
          }
        }

        // Re-throw the error so the caller can handle it if needed
        throw err;
      }
    },
    [callApi, clearError, clearFormErrors, onSuccess, onValidationError]
  );

  return {
    submitForm,
    formErrors,
    clearFieldError,
    clearFormErrors,
    loading,
    error,
    submitCount,
    isSubmitting: loading,
  };
};

export default useFormApiCall;
