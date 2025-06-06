import React from "react";
import { useError } from "../../utils/errorContext";
import ErrorNotification from "./ErrorNotification";

/**
 * Global error notification component that displays errors from the error context.
 * Place this component at the top level of your application to show global errors.
 *
 * @returns {React.ReactElement|null} The error notification or null if no error
 */
const GlobalErrorNotification = () => {
  const { error, clearError, retryLastAction, lastAction } = useError();

  // If no error, don't render anything
  if (!error) {
    return null;
  }

  return (
    <div
      className="global-error-container"
      style={{
        position: "fixed",
        top: "1rem",
        right: "1rem",
        zIndex: 1100,
        maxWidth: "450px",
        width: "100%",
      }}
    >
      <ErrorNotification
        error={error}
        onDismiss={clearError}
        onRetry={retryLastAction}
        canRetry={!!lastAction}
      />
    </div>
  );
};

export default GlobalErrorNotification;
