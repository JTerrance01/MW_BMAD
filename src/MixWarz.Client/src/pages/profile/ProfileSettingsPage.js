import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Nav,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaUser,
  FaIdCard,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import api from "../../services/api";
import userService from "../../services/userService";
import "./ProfileStyles.css";

// Helper function to validate bio content
const validateBio = (bioText) => {
  if (!bioText) return { isValid: true, message: "" }; // Empty is allowed

  if (bioText.length > 500) {
    return { isValid: false, message: "Bio cannot exceed 500 characters" };
  }

  // Check for any potentially problematic content
  const hasInvalidChars = /[<>]/.test(bioText);
  if (hasInvalidChars) {
    return {
      isValid: false,
      message: "Bio contains invalid characters (< or >)",
    };
  }

  return { isValid: true, message: "" };
};

// Helper to determine if the error is related to network or HTTPS issues
const isNetworkRelatedError = (error) => {
  if (!error) return false;

  const errorMessage = error.toString().toLowerCase();
  return (
    errorMessage.includes("network") ||
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("certificate") ||
    errorMessage.includes("ssl") ||
    errorMessage.includes("https")
  );
};

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'network', 'auth', or 'server'

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bioValidation, setBioValidation] = useState({
    isValid: true,
    message: "",
  });

  useEffect(() => {
    // Validate bio when it changes
    const result = validateBio(bio);
    setBioValidation(result);
  }, [bio]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      setError(null);
      setErrorType(null);

      try {
        // Use userService to fetch profile
        const profileResponse = await userService.getCurrentUserProfile();
        console.log("Profile data response:", profileResponse);

        // Set profile data
        setProfile(profileResponse);
        setFirstName(profileResponse.firstName || "");
        setLastName(profileResponse.lastName || "");
        setBio(profileResponse.bio || "");
      } catch (err) {
        console.error("Error in profile fetch:", err);

        // Determine error type
        if (isNetworkRelatedError(err)) {
          setErrorType("network");
        } else if (err.status === 401) {
          setErrorType("auth");
        } else {
          setErrorType("server");
        }

        setError(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate bio
    if (!bioValidation.isValid) {
      setFormError(bioValidation.message);
      return;
    }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      // Use userService to update bio
      const bioResponse = await userService.updateBio(bio);
      console.log("Bio update response in component:", bioResponse);

      // Update profile state
      setProfile({
        ...profile,
        firstName,
        lastName,
        bio,
      });

      setFormSuccess("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      setFormError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 profile-container text-center">
        <Spinner
          animation="border"
          role="status"
          style={{ color: "var(--accent-primary)" }}
        >
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3" style={{ color: "var(--text-primary)" }}>
          Loading profile settings...
        </p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 profile-container">
        <Alert variant={errorType === "network" ? "warning" : "danger"}>
          <h5
            style={{ color: errorType === "network" ? "#856404" : "#721c24" }}
          >
            {errorType === "network" ? (
              <>
                <FaExclamationTriangle className="me-2" />
                API Connection Error
              </>
            ) : errorType === "auth" ? (
              "Authentication Error"
            ) : (
              "Error Loading Profile"
            )}
          </h5>

          <p>{error}</p>

          {errorType === "network" && (
            <div className="mt-2 mb-3">
              <p className="mb-1">
                <strong>Possible Solutions:</strong>
              </p>
              <ul>
                <li>
                  Check if the API server is running at{" "}
                  <code>https://localhost:7001</code>
                </li>
                <li>
                  Verify that your browser accepts the HTTPS certificate (you
                  may need to navigate to the API URL directly and accept any
                  certificate warnings)
                </li>
                <li>Check your network connection</li>
              </ul>
            </div>
          )}

          <details>
            <summary>Technical details (for developers)</summary>
            <pre className="mt-2 p-2 bg-light">
              {JSON.stringify({ error, type: errorType }, null, 2)}
            </pre>
          </details>
        </Alert>

        <div className="d-flex justify-content-center mt-3">
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="me-2 profile-btn-primary"
          >
            Try Again
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => navigate("/profile")}
            className="profile-btn-secondary"
          >
            Back to Profile
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5 profile-container">
      <h2 className="profile-heading">Profile Settings</h2>

      <Row>
        <Col md={3} className="mb-4">
          <Card className="profile-card border-0">
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column profile-nav">
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "profile"}
                    onClick={() => setActiveTab("profile")}
                    className="rounded-0"
                  >
                    <FaUser className="me-2 icon" /> Profile
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "account"}
                    onClick={() => setActiveTab("account")}
                    className="rounded-0"
                  >
                    <FaIdCard className="me-2 icon" /> Account
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "security"}
                    onClick={() => setActiveTab("security")}
                    className="rounded-0"
                  >
                    <FaShieldAlt className="me-2 icon" /> Security
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>

          <div className="d-grid gap-2 mt-4">
            <Button
              variant="outline-primary"
              onClick={() => navigate("/profile")}
              className="profile-btn-secondary"
            >
              View My Profile
            </Button>
          </div>
        </Col>

        <Col md={9}>
          {activeTab === "profile" && (
            <Card className="profile-card">
              <Card.Header className="profile-card-header">
                <h5 className="mb-0">Profile Information</h5>
              </Card.Header>
              <Card.Body className="profile-card-body">
                {formError && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setFormError(null)}
                  >
                    {formError}
                  </Alert>
                )}

                {formSuccess && (
                  <Alert
                    variant="success"
                    dismissible
                    onClose={() => setFormSuccess(null)}
                  >
                    {formSuccess} <FaCheckCircle className="ms-1" />
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter your first name"
                          className="profile-form-control"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter your last name"
                          className="profile-form-control"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      isInvalid={!bioValidation.isValid}
                      className="profile-form-control"
                      maxLength={500}
                    />
                    <Form.Control.Feedback type="invalid">
                      {bioValidation.message}
                    </Form.Control.Feedback>
                    <Form.Text
                      className={
                        bio.length > 450 ? "text-warning" : "text-muted"
                      }
                    >
                      {bio.length}/500 characters
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={saving || !bioValidation.isValid}
                      className="profile-btn-primary"
                    >
                      {saving ? (
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
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {activeTab === "account" && (
            <Card className="profile-card">
              <Card.Header className="profile-card-header">
                <h5 className="mb-0">Account Settings</h5>
              </Card.Header>
              <Card.Body className="profile-card-body">
                <p>Account settings management will be available soon.</p>
              </Card.Body>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="profile-card">
              <Card.Header className="profile-card-header">
                <h5 className="mb-0">Security Settings</h5>
              </Card.Header>
              <Card.Body className="profile-card-body">
                <p>Security settings management will be available soon.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileSettingsPage;
