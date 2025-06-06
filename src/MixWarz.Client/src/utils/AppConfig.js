import { useEffect } from "react";
import api from "../services/api";

/**
 * AppConfig - A component that sets up global application configurations
 * like error handling for API requests
 */
const AppConfig = () => {
  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error("Unhandled Promise Rejection:", event.reason);

      // If it's a network error, we can show a user-friendly message
      if (event.reason && event.reason.isAxiosError) {
        console.error("Network Error:", {
          status: event.reason.response?.status,
          message: event.reason.message,
        });

        // Special handling for activity tracking errors to prevent them from disrupting user experience
        if (event.reason.config?.url?.includes("/api/UserActivity/track")) {
          console.warn(
            "Activity tracking error - suppressing to avoid UI disruption"
          );
          event.preventDefault(); // This prevents the error from being propagated further
          return;
        }

        // Check if it's a validation error with specific fields
        if (event.reason.response?.status === 400) {
          const data = event.reason.response.data;
          console.warn("Validation error details:", data);

          // If it contains field validation errors, log them
          if (data.errors) {
            console.table(data.errors);
          }
        }
      }
    };

    // Add global interceptor to handle 400 Bad Request errors
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Special handling for activity tracking errors
        if (error.config?.url?.includes("/api/UserActivity")) {
          console.warn("Activity tracking API error:", {
            status: error.response?.status,
            message: error.message,
            url: error.config.url,
          });

          // Handle 400 bad request errors with validation issues
          if (error.response?.status === 400 && error.response?.data?.errors) {
            console.error(
              "Activity validation errors:",
              error.response.data.errors
            );
          }

          // For activity tracking errors, we'll still reject so the service can handle it
          // but we've logged the details for debugging
        }

        // Continue with the error for normal handling
        return Promise.reject(error);
      }
    );

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      // Clean up the interceptor when component unmounts
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // This is a configuration component, it doesn't render anything
  return null;
};

export default AppConfig;
