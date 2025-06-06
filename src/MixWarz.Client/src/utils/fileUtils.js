/**
 * Utilities for file handling throughout the application
 */

/**
 * Validates if the file is an image and within size constraints
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Object} - Validation result with success flag and message
 */
export const validateImageFile = (file, maxSizeMB = 2) => {
  if (!file) {
    return {
      success: false,
      message: "No file selected",
    };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      message: "Please select an image file (JPEG, PNG)",
    };
  }

  // Validate file size (default 2MB)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      success: false,
      message: `Image size must be less than ${maxSizeMB}MB`,
    };
  }

  return {
    success: true,
    message: "File is valid",
  };
};

/**
 * Validates if the file is an audio file and within size constraints
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Object} - Validation result with success flag and message
 */
export const validateAudioFile = (file, maxSizeMB = 100) => {
  if (!file) {
    return {
      success: false,
      message: "No file selected",
    };
  }

  // Validate file type (audio files only)
  const allowedTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp3",
    "audio/aiff",
    "audio/x-aiff",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      message:
        "Invalid file type. Please upload an audio file (MP3, WAV, AIFF).",
    };
  }

  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      success: false,
      message: `File size exceeds ${maxSizeMB}MB limit.`,
    };
  }

  return {
    success: true,
    message: "File is valid",
  };
};

/**
 * Creates a data URL for image preview
 * @param {File} file - The image file
 * @returns {Promise<string>} - Promise resolving to the data URL
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Format file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
};
