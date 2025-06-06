import { jwtDecode } from "jwt-decode";

/**
 * Checks if a user has any of the specified admin roles
 * @param {Array|String} userRoles - The user's role(s)
 * @param {Array} adminRoles - List of roles considered as admin/organizer
 * @returns {Boolean} - Whether the user has an admin role
 */
export const hasAdminRole = (
  userRoles,
  adminRoles = ["Admin", "Organizer", "admin", "organizer"]
) => {
  if (!userRoles) return false;

  // Handle array of roles
  if (Array.isArray(userRoles)) {
    return userRoles.some((role) =>
      adminRoles.some(
        (adminRole) => role.toLowerCase() === adminRole.toLowerCase()
      )
    );
  }

  // Handle string role
  if (typeof userRoles === "string") {
    return adminRoles.some(
      (adminRole) => userRoles.toLowerCase() === adminRole.toLowerCase()
    );
  }

  // Handle object with keys (like from Microsoft Identity claims)
  if (typeof userRoles === "object" && !Array.isArray(userRoles)) {
    return Object.values(userRoles).some(
      (role) =>
        typeof role === "string" &&
        adminRoles.some(
          (adminRole) => role.toLowerCase() === adminRole.toLowerCase()
        )
    );
  }

  return false;
};

/**
 * Extracts roles from a JWT token, handling different formats
 * @param {string} [providedToken] - Optional token, if not provided will use localStorage
 * @returns {Object} Object containing different representations of roles
 */
export const getRolesFromToken = (providedToken) => {
  try {
    const token = providedToken || localStorage.getItem("token");
    if (!token) return null;

    const decoded = jwtDecode(token);

    // Standard role properties
    const standardRoles = decoded.role || decoded.roles || [];

    // Microsoft Identity claims format
    const msClaimsKey =
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const msRoles = decoded[msClaimsKey] || [];

    return {
      standardRoles,
      msRoles,
      allRoles: [
        ...(Array.isArray(standardRoles) ? standardRoles : [standardRoles]),
        ...(Array.isArray(msRoles) ? msRoles : [msRoles]),
      ].filter(Boolean),
    };
  } catch (error) {
    console.error("Error extracting roles from token:", error);
    return { standardRoles: [], msRoles: [], allRoles: [] };
  }
};

/**
 * Checks if the current user token has any admin/organizer role
 * @returns {Boolean} Whether the user has admin privileges
 */
export const currentUserHasAdminRole = () => {
  const { allRoles, msRoles } = getRolesFromToken() || {};

  // Check all extracted roles first
  if (hasAdminRole(allRoles)) {
    console.log("Admin role found in combined roles");
    return true;
  }

  // Check Microsoft Identity format specifically
  if (hasAdminRole(msRoles)) {
    console.log("Admin role found in Microsoft Identity format");
    return true;
  }

  return false;
};
