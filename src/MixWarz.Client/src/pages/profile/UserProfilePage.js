import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Image,
  Tabs,
  Tab,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUser,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaChartBar,
  FaHistory,
} from "react-icons/fa";
import { createImagePreview } from "../../utils/fileUtils";
import UserSubmissionsList from "../../components/profile/UserSubmissionsList";
// import UserActivityStats from "../../components/profile/UserActivityStats";
// import UserActivityHistory from "../../components/profile/UserActivityHistory";
import * as activityTracker from "../../utils/activityTracker";

import userService from "../../services/userService";
import useApiCall from "../../utils/useApiCall";
import { useError } from "../../utils/errorContext";
import { updateUserProfile } from "../../store/authSlice";

const UserProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { handleError } = useError();
  const dispatch = useDispatch();

  // Add a ref to track if initial load has happened
  const initialLoadRef = useRef(false);

  // Add refs to store stable values for the API calls
  const usernameRef = useRef(username);
  const authRef = useRef({ isAuthenticated, user });

  // Update refs when values change
  useEffect(() => {
    usernameRef.current = username;
    authRef.current = { isAuthenticated, user };
  }, [username, isAuthenticated, user]);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // Bio editing states
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioError, setBioError] = useState(null);
  const [bioSuccess, setBioSuccess] = useState(null);
  const [savingBio, setSavingBio] = useState(false);

  // Profile picture upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Use stable refs for bio and profile picture operations
  const bioRef = useRef("");
  useEffect(() => {
    bioRef.current = bioText;
  }, [bioText]);

  // Use our custom hook for API calls
  const {
    loading: loadingProfile,
    error: profileError,
    callApi: fetchProfile,
  } = useApiCall(
    async () => {
      const currentUsername = usernameRef.current;
      const { isAuthenticated, user } = authRef.current;

      console.log("Fetch profile for:", currentUsername);
      console.log("Current auth user:", user);

      // More robust check for current user
      if (!currentUsername) {
        console.log("No username in URL, loading current user profile");
        const data = await userService.getCurrentUserProfile();
        setIsCurrentUser(true);
        return data;
      } else if (isAuthenticated && user?.username === currentUsername) {
        console.log(
          "Username matches logged in user, loading current user profile"
        );
        const data = await userService.getCurrentUserProfile();
        setIsCurrentUser(true);
        return data;
      } else {
        console.log("Loading other user profile for:", currentUsername);
        const data = await userService.getUserProfile(currentUsername);
        setIsCurrentUser(user?.username === data.username);
        return data;
      }
    },
    { errorContext: "User Profile", showErrorNotification: true }
  );

  const {
    loading: updatingBio,
    error: bioUpdateError,
    callApi: updateBio,
  } = useApiCall(async (bio) => await userService.updateBio(bio), {
    errorContext: "Update Bio",
    showErrorNotification: true,
  });

  const {
    loading: uploadingPicture,
    error: pictureUploadError,
    callApi: uploadPicture,
  } = useApiCall(
    async (file, onProgress) =>
      await userService.uploadProfilePicture(file, onProgress),
    { errorContext: "Profile Picture Upload", showErrorNotification: true }
  );

  // Add a safety wrapper for activity tracking to prevent errors from breaking the app
  const safeTrackActivity = async (action, ...args) => {
    // If activityTracker isn't loaded or enabled, skip tracking entirely
    if (!activityTracker || !activityTracker.isEnabled()) {
      console.log(
        `[PROFILE] Skipping activity tracking for '${action}': tracker not available or disabled`
      );
      return;
    }

    try {
      const method = activityTracker[action];
      if (typeof method !== "function") {
        console.warn(`[PROFILE] Activity tracker method '${action}' not found`);
        return;
      }

      // Use a promise with timeout to prevent long-running tracking operations
      const timeoutMs = 2000; // 2 seconds max timeout

      const trackingPromise = method(...args);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tracking timeout")), timeoutMs)
      );

      // Race the tracking operation against the timeout
      return await Promise.race([trackingPromise, timeoutPromise]).catch(
        (err) => {
          console.warn(
            `[PROFILE] Activity tracking '${action}' failed or timed out:`,
            err.message
          );
          return undefined; // Always return something to prevent further errors
        }
      );
    } catch (error) {
      console.warn(
        `[PROFILE] Safe activity tracking failed for '${action}':`,
        error.message
      );
      // Completely suppress errors from activity tracking
      return undefined;
    }
  };

  // Load profile data on component mount or when username changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("[PROFILE] Fetching profile data");
        const profileData = await fetchProfile();

        if (profileData) {
          console.log("[PROFILE] Profile data loaded successfully");
          setProfile(profileData);
          setBioText(profileData.bio || "");
          setError(null);
        }
      } catch (err) {
        console.error("[PROFILE] Error loading profile data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username]);

  // Separate activity tracking into its own effect to fully decouple from the critical path
  useEffect(() => {
    // Only attempt tracking after the profile has loaded successfully
    if (profile && !loading && !error) {
      console.log("[PROFILE] Attempting to track page view");

      // Schedule activity tracking to happen after rendering is complete
      const trackingTimeout = setTimeout(() => {
        try {
          // Use the safe tracking wrapper to handle any potential errors
          if (username) {
            safeTrackActivity("trackPageView", `User Profile - ${username}`);
          } else {
            safeTrackActivity("trackPageView", "My Profile");
          }
        } catch (trackingError) {
          // Completely suppress any activity tracking errors
          console.warn(
            "[PROFILE] Activity tracking attempted and failed (non-critical):",
            trackingError.message
          );
        }
      }, 500); // Delay tracking to ensure page has fully rendered

      // Clean up timeout if component unmounts
      return () => clearTimeout(trackingTimeout);
    }
  }, [profile, loading, error, username]);

  // Sync loading state with loadingProfile from useApiCall
  useEffect(() => {
    if (loading !== loadingProfile) {
      console.log("Loading profile state changed:", loadingProfile);
      setLoading(loadingProfile);
    }
  }, [loadingProfile, loading]);

  // Sync error state with profileError from useApiCall
  useEffect(() => {
    if (profileError && (!error || error !== profileError.message)) {
      console.error("Profile error detected:", profileError);
      setError(profileError.message || "Failed to load profile");
    }
  }, [profileError, error]);

  // Add debug logging for component lifecycle
  useEffect(() => {
    console.log("UserProfilePage mounted");
    console.log("User object:", user);
    console.log("User roles:", user?.roles);
    console.log("Is authenticated:", isAuthenticated);
    console.log("Is current user:", isCurrentUser);
    return () => {
      console.log("UserProfilePage unmounted");
    };
  }, [user, isAuthenticated, isCurrentUser]);

  const handleBioChange = (e) => {
    const text = e.target.value;
    setBioText(text);

    // Reset error message when user types
    if (bioError) {
      setBioError(null);
    }

    // Validate length
    if (text.length > 500) {
      setBioError("Bio cannot exceed 500 characters");
    }
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    setBioError(null);
    setBioSuccess(null);

    try {
      console.log("Attempting to update bio:", bioText);
      const result = await updateBio(bioText);

      if (result && !result.error) {
        console.log("Bio update successful");
        setBioSuccess("Bio updated successfully!");
        setIsEditingBio(false);

        // Update profile in state
        if (profile) {
          setProfile({ ...profile, bio: bioText });
        }

        // Track this activity using our safe wrapper
        setTimeout(() => {
          safeTrackActivity("trackProfileUpdate", "bio");
        }, 100);
      } else {
        console.log("Bio update failed:", result?.message);
        setBioError(
          result?.message || "Failed to update bio. Please try again."
        );
      }
    } catch (err) {
      console.error("Bio update error:", err);
      setBioError(
        "An error occurred while updating your bio. Please try again."
      );
    } finally {
      setSavingBio(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous errors/success
    setUploadError(null);
    setUploadSuccess(null);
    setPreviewUrl(null);
    setSelectedFile(null);

    console.log(
      `Selected file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(
        2
      )}MB, Type: ${file.type}`
    );

    // Validate file type more specifically
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError(
        `Invalid file type: ${file.type}. Please select a JPEG or PNG image.`
      );
      return;
    }

    // Validate file size with clearer message
    const maxSizeMB = 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(
        `File size (${(file.size / 1024 / 1024).toFixed(
          2
        )}MB) exceeds the maximum allowed (${maxSizeMB}MB).`
      );
      return;
    }

    setSelectedFile(file);

    // Create preview using utility function
    try {
      const preview = await createImagePreview(file);
      setPreviewUrl(preview);
    } catch (err) {
      console.error("Error creating preview:", err);
      setUploadError(
        "Could not generate image preview. Please try another image."
      );
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    try {
      console.log("Attempting to upload profile picture", {
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        type: selectedFile.type,
      });

      // Debug: Log the entire profile object to check property names
      console.log("Profile object for debugging:", profile);

      // Additional validation before sending
      if (!selectedFile.type.match(/image\/(jpeg|jpg|png)/i)) {
        throw new Error("File must be a JPEG or PNG image");
      }

      if (selectedFile.size > 2 * 1024 * 1024) {
        throw new Error("File size exceeds 2MB limit");
      }

      // Get the user ID from the profile
      const userId = profile?.userId || profile?.UserId; // Try both casing variants
      console.log(`Uploading profile picture for user ID: ${userId}`);

      // Add failsafe - if we still don't have userId, try to get it from the token
      let finalUserId = userId;
      if (!finalUserId && token) {
        try {
          // Try to extract user ID from JWT token
          const tokenData = JSON.parse(atob(token.split(".")[1]));
          finalUserId =
            tokenData.nameid ||
            tokenData.sub ||
            tokenData.userId ||
            tokenData.UserId;
          console.log(`Extracted user ID from token: ${finalUserId}`);
        } catch (err) {
          console.error("Failed to extract user ID from token:", err);
        }
      }

      // Create a direct FormData object for more control
      const formData = new FormData();
      formData.append("ProfilePicture", selectedFile);

      // Ensure UserId is included (both with uppercase U and lowercase u to be safe)
      if (finalUserId) {
        formData.append("UserId", finalUserId);
        formData.append("userId", finalUserId);
        console.log(`Added user ID to form data: ${finalUserId}`);
      } else {
        console.warn("No user ID available from profile or token!");
      }

      // Log the form data for debugging
      console.log("Form data entries:");
      for (let [key, value] of formData.entries()) {
        console.log(
          `> ${key}: ${value instanceof File ? `File: ${value.name}` : value}`
        );
      }

      // Use direct API call instead of the uploadPicture wrapper
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/UserProfile/update-profile-picture");

      // Add authentication token from localStorage
      const token = localStorage.getItem("token");
      if (token) {
        console.log("Adding Authorization header with token");
        // Log first 10 characters of token for debugging (don't log full token for security)
        console.log(`Token starts with: ${token.substring(0, 10)}...`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      } else {
        console.error("No authentication token found in localStorage");
        setUploadError("Authentication error: Not logged in");
        setUploading(false);
        return;
      }

      // Set content type headers
      xhr.setRequestHeader("Accept", "application/json");
      // Note: Do NOT set Content-Type header for FormData - the browser will set it with the correct boundary

      // Add progress tracking
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
          console.log(`Upload progress: ${percentComplete}%`);
        }
      };

      // Create a promise to handle the response
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Invalid response format"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);

              // Handle specific 400 Bad Request errors
              if (xhr.status === 400) {
                console.error("Bad Request (400):", errorData);

                // Check if the error is specifically about UserId
                if (errorData.errors && errorData.errors.UserId) {
                  const userIdErrors = errorData.errors.UserId;
                  console.error("UserId validation errors:", userIdErrors);
                  reject(new Error(`UserId error: ${userIdErrors.join(", ")}`));
                } else {
                  reject(
                    new Error(
                      `Bad request: ${JSON.stringify(errorData.errors || {})}`
                    )
                  );
                }
              }
              // Handle specific error status codes
              else if (xhr.status === 401) {
                console.error("Authentication failed (401 Unauthorized)");
                reject(
                  new Error("Authentication failed. Please log in again.")
                );
              } else if (xhr.status === 403) {
                console.error("Permission denied (403 Forbidden)");
                reject(
                  new Error(
                    "You don't have permission to upload a profile picture."
                  )
                );
              } else {
                console.error(`API error (${xhr.status}):`, errorData);
                reject(errorData);
              }
            } catch (e) {
              console.error("Error parsing error response:", e);
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error occurred"));
      });

      // Send the request
      xhr.withCredentials = true; // Include credentials
      xhr.send(formData);

      // Wait for the upload to complete
      try {
        const response = await uploadPromise;
        console.log("Upload response:", response);

        if (response && !response.error) {
          console.log("Upload successful:", response.profilePictureUrl);
          setUploadSuccess("Profile picture updated successfully!");
          setSelectedFile(null);
          setPreviewUrl(null);

          // Update profile in state with new URL
          if (profile) {
            setProfile({
              ...profile,
              profilePictureUrl: response.profilePictureUrl,
            });
          }

          // Also update the Redux store with the new profile picture URL
          console.log(
            "Dispatching profile picture update to Redux:",
            response.profilePictureUrl
          );
          dispatch(
            updateUserProfile({
              profilePictureUrl: response.profilePictureUrl,
            })
          );

          // Debug the Redux state after update using the user from context
          setTimeout(() => {
            console.log("Dispatched profile update. Check navbar for changes.");
          }, 500);

          // Track this activity using our safe wrapper
          setTimeout(() => {
            safeTrackActivity("trackProfileUpdate", "picture");
          }, 100);
        } else {
          console.log("Upload failed:", response?.message || "Unknown error");
          setUploadError(
            response?.message ||
              "Failed to upload profile picture. Please check file requirements and try again."
          );
        }
      } catch (err) {
        console.error("Upload error:", err);
        setUploadError(
          `Upload error: ${
            err.message || "An unknown error occurred"
          }. Please try again later.`
        );
      } finally {
        setUploading(false);
      }
    } catch (err) {
      console.error("Profile picture upload error:", err);
      setUploadError(
        `Upload error: ${
          err.message || "An unknown error occurred"
        }. Please try again later.`
      );
    }
  };

  // Add ability to toggle activity tracking for admins
  const [trackingEnabled, setTrackingEnabled] = useState(
    activityTracker.isEnabled()
  );

  const toggleActivityTracking = useCallback(() => {
    try {
      console.log("[PROFILE] Toggling activity tracking");
      const newState = !trackingEnabled;
      const success = activityTracker.setEnabled(newState);

      if (success) {
        console.log(
          `[PROFILE] Activity tracking ${newState ? "enabled" : "disabled"}`
        );
        setTrackingEnabled(newState);

        // Reset error count in the tracker if enabling
        if (
          newState &&
          typeof window !== "undefined" &&
          window.__activityTrackerDebug
        ) {
          window.__activityTrackerDebug.status();
        }

        // Show visual feedback before reloading
        setTimeout(() => {
          // Reload the page to apply the changes
          window.location.reload();
        }, 500);
      } else {
        console.error("[PROFILE] Failed to toggle activity tracking");
      }
    } catch (error) {
      console.error("[PROFILE] Error toggling activity tracking:", error);
    }
  }, [trackingEnabled]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading profile...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate(-1)} className="mt-3">
          Go Back
        </Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Profile not found</Alert>
        <Button
          variant="primary"
          onClick={() => navigate("/")}
          className="mt-3"
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={4} md={5} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center">
              <div className="mb-4">
                {profile.profilePictureUrl ? (
                  <Image
                    src={profile.profilePictureUrl}
                    roundedCircle
                    className="profile-image"
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                      border: "3px solid #f8f9fa",
                    }}
                    alt={profile.username}
                  />
                ) : (
                  <div
                    className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                    style={{
                      width: "150px",
                      height: "150px",
                      border: "3px solid #f8f9fa",
                    }}
                  >
                    <FaUser size={64} className="text-secondary" />
                  </div>
                )}
              </div>

              <h4 className="mb-1">
                {profile.firstName} {profile.lastName}
              </h4>
              <p className="text-muted mb-3">@{profile.username}</p>

              {isCurrentUser && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="mb-3"
                  onClick={() => setIsEditingBio(!isEditingBio)}
                >
                  <FaEdit className="me-1" />
                  {isEditingBio ? "Cancel Edit" : "Edit Bio"}
                </Button>
              )}

              {isEditingBio ? (
                <Form onSubmit={handleBioSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Write a short bio about yourself..."
                      value={bioText}
                      onChange={handleBioChange}
                      maxLength={500}
                      isInvalid={!!bioError}
                    />
                    <Form.Text className="text-muted">
                      {bioText.length}/500 characters
                    </Form.Text>
                    {bioError && (
                      <Form.Control.Feedback type="invalid">
                        {bioError}
                      </Form.Control.Feedback>
                    )}
                    {bioSuccess && (
                      <div className="text-success mt-1">
                        <FaCheckCircle className="me-1" />
                        {bioSuccess}
                      </div>
                    )}
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={savingBio || bioText.length > 500}
                    className="mb-2"
                  >
                    {savingBio ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-1"
                        />
                        Saving...
                      </>
                    ) : (
                      "Save Bio"
                    )}
                  </Button>
                </Form>
              ) : (
                <div className="bio-section text-start">
                  <p className="mb-0">
                    {profile.bio ||
                      (isCurrentUser
                        ? "Add a bio to tell others about yourself"
                        : "No bio available")}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          {isCurrentUser && (
            <Card className="shadow-sm border-0 mt-4">
              <Card.Header>
                <h5 className="mb-0">Profile Picture</h5>
              </Card.Header>
              <Card.Body>
                {uploadError && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setUploadError(null)}
                  >
                    <FaTimesCircle className="me-1" />
                    {uploadError}
                  </Alert>
                )}

                {uploadSuccess && (
                  <Alert
                    variant="success"
                    dismissible
                    onClose={() => setUploadSuccess(null)}
                  >
                    <FaCheckCircle className="me-1" />
                    {uploadSuccess}
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Select a new profile picture</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="mb-2"
                  />
                  <div className="d-flex justify-content-between align-items-center">
                    <Form.Text className="text-muted">
                      Max size: 2MB. Formats: JPEG, PNG
                    </Form.Text>
                    {selectedFile && (
                      <small className="text-info">
                        Selected: {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                      </small>
                    )}
                  </div>
                </Form.Group>

                {previewUrl && (
                  <div className="text-center mb-3">
                    <p className="mb-1">Preview:</p>
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      rounded
                      className="preview-image"
                      style={{ maxWidth: "100%", maxHeight: "200px" }}
                    />
                  </div>
                )}

                {uploading && (
                  <div className="mb-3">
                    <p className="mb-1">Uploading: {uploadProgress}%</p>
                    <div className="progress">
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        role="progressbar"
                        style={{ width: `${uploadProgress}%` }}
                        aria-valuenow={uploadProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                )}

                <div className="d-grid">
                  <Button
                    variant="primary"
                    onClick={handleUploadProfilePicture}
                    disabled={!selectedFile || uploading}
                    className="mb-2"
                  >
                    {uploading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-1"
                        />
                        Uploading...
                      </>
                    ) : (
                      "Upload Profile Picture"
                    )}
                  </Button>
                </div>
                <div className="mt-3 px-2">
                  <h6 className="text-muted mb-2">Requirements:</h6>
                  <ul className="small text-muted">
                    <li>Image must be JPEG or PNG format</li>
                    <li>Maximum file size: 2MB</li>
                    <li>Recommended dimensions: 300x300 pixels</li>
                    <li>Square aspect ratio works best</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={8} md={7}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Tabs defaultActiveKey="submissions" className="mb-3">
                <Tab eventKey="submissions" title="Submissions">
                  <UserSubmissionsList isCurrentUser={isCurrentUser} />
                </Tab>

                {/* FUTURE: Competitions Tab - Temporarily disabled
                <Tab eventKey="competitions" title="Competitions">
                  <p className="text-muted">
                    User's created competitions will be displayed here.
                  </p>
                </Tab>
                */}

                {/* FUTURE: Gallery Tab - Temporarily disabled
                <Tab eventKey="gallery" title="Gallery">
                  <p className="text-muted">
                    User's gallery images will be displayed here.
                  </p>
                </Tab>
                */}

                {/* FUTURE: Audio Portfolio Tab - Temporarily disabled
                <Tab eventKey="audio" title="Audio Portfolio">
                  <p className="text-muted">
                    User's audio portfolio will be displayed here.
                  </p>
                </Tab>
                */}

                <Tab eventKey="activity-stats" title={
                  <>
                    <FaChartBar className="me-1" />
                    Activity Stats
                  </>
                }>
                  <p className="text-muted">
                    User's activity statistics will be displayed here.
                  </p>
                </Tab>

                <Tab eventKey="activity-history" title={
                  <>
                    <FaHistory className="me-1" />
                    Activity History
                  </>
                }>
                  <p className="text-muted">
                    User's activity history will be displayed here.
                  </p>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>

          {isCurrentUser && (
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mb-4">
              <Link to="/products" className="btn btn-outline-secondary">
                Browse Products
              </Link>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfilePage;
