import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ErrorNotification from "./ErrorNotification";
import { handleApiError } from "../../utils/errorHandling";

/**
 * Higher-order component that adds error handling UI to a component
 *
 * @param {React.ComponentType} WrappedComponent - The component to wrap
 * @param {Object} options - Configuration options
 * @param {boolean} options.showDetails - Whether to show technical details (default: based on environment)
 * @param {number} options.autoDismissAfter - Auto-dismiss error after milliseconds (0 = never)
 * @returns {React.ComponentType} The wrapped component with error handling
 */
const withErrorHandlingUI = (
  WrappedComponent,
  {
    showDetails = process.env.NODE_ENV === "development",
    autoDismissAfter = 0,
  } = {}
) => {
  // Return a new functional component
  const WithErrorHandling = (props) => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastAction, setLastAction] = useState(null);

    // Handle API errors with standard flow
    const handleError = useCallback(
      (error, context = "API Error", actionCallback = null) => {
        // Store the action callback for retry functionality
        if (actionCallback && typeof actionCallback === "function") {
          setLastAction(() => actionCallback);
        }

        // Process the error with our utility
        const formattedError = handleApiError(error, {
          context,
          onAuthentication: () => {
            // For authentication errors, redirect to login after a short delay
            setTimeout(() => {
              navigate("/login?expired=true", {
                state: {
                  message: "Your session has expired. Please sign in again.",
                },
              });
            }, 100);
          },
          onRedirect: (redirect) => {
            // Handle redirects recommended by error handler
            setTimeout(() => {
              navigate(redirect.path, { state: { message: redirect.message } });
            }, 100);
          },
        });

        // Set the error state to display the notification
        setError(formattedError);

        return formattedError;
      },
      [navigate]
    );

    // Clear the error state
    const clearError = useCallback(() => {
      setError(null);
    }, []);

    // Retry the last action if available
    const handleRetry = useCallback(async () => {
      if (lastAction) {
        setIsRetrying(true);
        clearError();

        try {
          await lastAction();
        } catch (err) {
          // Error will be handled in the component's catch block
          // which will call handleError again
        } finally {
          setIsRetrying(false);
        }
      }
    }, [lastAction, clearError]);

    // Pass these error handling functions as props to the wrapped component
    const errorHandlingProps = {
      handleError,
      clearError,
      hasError: !!error,
      isRetrying,
    };

    return (
      <>
        {/* Render the error notification if there's an error */}
        {error && (
          <ErrorNotification
            error={error}
            onDismiss={clearError}
            onRetry={handleRetry}
            canRetry={!!lastAction}
            showDetails={showDetails}
            autoDismissAfter={autoDismissAfter}
          />
        )}

        {/* Render the wrapped component with the extra props */}
        <WrappedComponent {...props} {...errorHandlingProps} />
      </>
    );
  };

  // Set displayName for debugging
  const wrappedComponentName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";
  WithErrorHandling.displayName = `withErrorHandlingUI(${wrappedComponentName})`;

  return WithErrorHandling;
};

export default withErrorHandlingUI;
