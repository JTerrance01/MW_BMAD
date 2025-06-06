// Logo utilities for the application

// Default fallback image (inline SVG as data URL)
const defaultLogoSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Cpath fill='%23007bff' d='M20 10h20v40H20zM50 10h20v40H50zM80 10h20v40H80zM110 30h60v5h-60z'/%3E%3Cpath fill='%23343a40' d='M110 40h60v5h-60zM110 20h60v5h-60z'/%3E%3C/svg%3E`;

// Get application logo
export const getAppLogo = (variant = "default") => {
  try {
    // In a production app, we would use actual logo files
    // Since our files were deleted, we're returning an inline SVG
    return defaultLogoSvg;
  } catch (error) {
    console.error("Error loading logo:", error);
    return defaultLogoSvg;
  }
};

// Generate placeholder logo with text
export const generateTextLogo = (text = "MixWarz") => {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 60;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#007bff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL("image/png");
};

// Export default functions
export default {
  getAppLogo,
  generateTextLogo,
};
