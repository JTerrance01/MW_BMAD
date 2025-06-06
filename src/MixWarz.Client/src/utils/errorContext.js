import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  formatApiError,
  handleApiError,
  ErrorTypes,
  getErrorRedirect,
  createErrorHandler,
} from "./errorHandling";

// Create an error context to provide global error handling
const ErrorContext = createContext({
  error: null,
  setError: () => {},
  clearError: () => {},
  handleError: () => {},
  retryLastAction: () => {},
  lastAction: null,
});

/**
 * Provider component that wraps your app and makes error handling available
 * to all components within it.
 */
export const ErrorProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setErrorState] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState(null);
    setLastAction(null);
  }, []);

  // Create a reusable error handler with default navigation behavior
  const errorHandler = useCallback(
    createErrorHandler({
      context: "App",
      onRedirect: (redirect) => {
        if (redirect && redirect.path) {
          setTimeout(() => {
            navigate(redirect.path, {
              state: {
                message: redirect.message,
                from: location.pathname,
              },
            });
          }, 100);
        }
      },
      onAuthentication: () => {
        setTimeout(() => {
          navigate("/login?expired=true", {
            state: {
              message: "Your session has expired. Please sign in again.",
              from: location.pathname,
            },
          });
        }, 100);
      },
    }),
    [navigate, location.pathname]
  );

  // Clear error on location change
  useEffect(() => {
    clearError();
  }, [location.pathname, clearError]);

  // Main error handler function
  const handleError = useCallback(
    (error, actionCallback = null, context = "App Error") => {
      // Store the action for retry functionality
      if (actionCallback && typeof actionCallback === "function") {
        setLastAction(() => actionCallback);
      } else {
        setLastAction(null);
      }

      // Process the error with our utility
      const formattedError = errorHandler.handle(error, { context });

      // Set the error state to display in UI
      setErrorState(formattedError);

      return formattedError;
    },
    [errorHandler]
  );

  // Simple error setter that formats the error
  const setError = useCallback(
    (error, actionCallback = null) => {
      if (!error) {
        clearError();
        return;
      }

      // Format the error if it's not already formatted
      const formattedError =
        error.type && Object.values(ErrorTypes).includes(error.type)
          ? error
          : formatApiError(error);

      // Set last action if provided
      if (actionCallback && typeof actionCallback === "function") {
        setLastAction(() => actionCallback);
      }

      setErrorState(formattedError);
    },
    [clearError]
  );

  // Retry the last action if available
  const retryLastAction = useCallback(async () => {
    if (!lastAction) return;

    try {
      clearError();
      await lastAction();
    } catch (err) {
      // The new error will be handled by the action's catch block
      // which should call handleError again
    }
  }, [lastAction, clearError]);

  // Provide the error context to children
  const contextValue = {
    error,
    setError,
    clearError,
    handleError,
    retryLastAction,
    lastAction: !!lastAction,
    // Add additional utility functions from error handler
    getErrorMessage: errorHandler.getErrorMessage,
    getValidationErrors: errorHandler.getValidationErrors,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Custom hook to use the error context
 */
export const useError = () => {
  const context = useContext(ErrorContext);

  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }

  return context;
};

export default ErrorContext;
