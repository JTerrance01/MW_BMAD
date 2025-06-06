import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";
import {
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import { ErrorTypes, getUserFriendlyMessage } from "../../utils/errorHandling";

/**
 * ErrorNotification component displays API error messages with appropriate styling
 * and actions based on error type.
 *
 * @param {Object} props - Component props
 * @param {Object} props.error - The formatted API error object
 * @param {Function} props.onDismiss - Optional callback when error is dismissed
 * @param {Function} props.onRetry - Optional callback to retry the failed action
 * @param {boolean} props.canRetry - Whether the action can be retried
 * @param {boolean} props.showDetails - Whether to show technical details (for developers)
 * @param {number} props.autoDismissAfter - Milliseconds after which to auto-dismiss (0 for never)
 */
const ErrorNotification = ({
  error,
  onDismiss,
  onRetry,
  canRetry = false,
  showDetails = process.env.NODE_ENV === "development",
  autoDismissAfter = 0,
}) => {
  const [visible, setVisible] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Auto-dismiss timer if enabled
  useEffect(() => {
    if (visible && autoDismissAfter > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissAfter);

      return () => clearTimeout(timer);
    }
  }, [visible, autoDismissAfter]);

  // Reset visibility when error changes
  useEffect(() => {
    setVisible(true);
    setShowTechnicalDetails(false);
  }, [error]);

  // If no error or not visible, don't render
  if (!error || !visible) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Get variant based on error type
  const getVariant = () => {
    switch (error.type) {
      case ErrorTypes.AUTHENTICATION:
      case ErrorTypes.AUTHORIZATION:
        return "warning";
      case ErrorTypes.VALIDATION:
        return "danger";
      case ErrorTypes.SERVER:
        return "danger";
      case ErrorTypes.NETWORK:
      case ErrorTypes.TIMEOUT:
        return "secondary";
      case ErrorTypes.NOT_FOUND:
        return "info";
      default:
        return "danger";
    }
  };

  // Get icon based on error type
  const getIcon = () => {
    switch (error.type) {
      case ErrorTypes.AUTHENTICATION:
      case ErrorTypes.AUTHORIZATION:
      case ErrorTypes.VALIDATION:
        return <FaExclamationTriangle className="me-2" />;
      case ErrorTypes.SERVER:
        return <FaTimesCircle className="me-2" />;
      case ErrorTypes.NETWORK:
      case ErrorTypes.TIMEOUT:
      case ErrorTypes.NOT_FOUND:
        return <FaInfoCircle className="me-2" />;
      default:
        return <FaExclamationTriangle className="me-2" />;
    }
  };

  // Get user-friendly message text
  const message = getUserFriendlyMessage(error);

  return (
    <Alert
      variant={getVariant()}
      className="d-flex align-items-start shadow-sm border-0"
      data-testid="error-notification"
    >
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between align-items-center">
          <Alert.Heading className="h5 mb-0 d-flex align-items-center">
            {getIcon()}
            {error.type === ErrorTypes.VALIDATION
              ? "Validation Error"
              : "Error"}
          </Alert.Heading>
          <Button
            variant="link"
            className="p-0 text-decoration-none"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <FaTimes />
          </Button>
        </div>

        <p className="mt-2 mb-1">{message}</p>

        {/* Show field validation errors if present */}
        {error.type === ErrorTypes.VALIDATION && error.validationErrors && (
          <ul className="mt-2 mb-0 ps-3">
            {Object.entries(error.validationErrors).map(([field, message]) => (
              <li key={field}>
                <strong>{field}:</strong> {message}
              </li>
            ))}
          </ul>
        )}

        {/* Action buttons */}
        <div className="mt-3 d-flex gap-2">
          {canRetry && onRetry && (
            <Button size="sm" variant="outline-secondary" onClick={onRetry}>
              Try Again
            </Button>
          )}

          {showDetails && (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              aria-expanded={showTechnicalDetails}
            >
              {showTechnicalDetails ? "Hide" : "Show"} Technical Details
            </Button>
          )}
        </div>

        {/* Technical details for developers */}
        {showDetails && showTechnicalDetails && (
          <div className="mt-3">
            <hr className="my-2" />
            <small className="text-muted">Technical Details:</small>
            <pre
              className="mt-1 p-2 bg-light rounded small"
              style={{ maxHeight: "200px", overflow: "auto" }}
            >
              {JSON.stringify(
                {
                  type: error.type,
                  message: error.message,
                  status: error.status,
                  timestamp: error.timestamp,
                  details: error.details,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </Alert>
  );
};

export default ErrorNotification;
