import React, { useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { submitCompetitionEntry } from "../../store/competitionSlice";
import { FaCloudUploadAlt, FaMusic } from "react-icons/fa";

const SubmissionUploadForm = ({ competitionId }) => {
  const dispatch = useDispatch();
  const { submitting, submission, error } = useSelector(
    (state) => state.competitions
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    mixTitle: "",
    mixDescription: "",
  });
  const [audioFile, setAudioFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Max file size in bytes (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  // Allowed audio formats
  const ALLOWED_FORMATS = [
    "audio/mp3",
    "audio/mpeg"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (!file) {
      setAudioFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File size exceeds the maximum allowed (50MB). Your file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`
      );
      setAudioFile(null);
      return;
    }

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      setFileError(
        "File format not supported. Please upload MP3 files."
      );
      setAudioFile(null);
      return;
    }

    setAudioFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.mixTitle.trim()) {
      setFormError("Please enter a title for your mix");
      return;
    }

    if (!formData.mixDescription.trim()) {
      setFormError("Please enter a description for your mix");
      return;
    }

    if (!audioFile) {
      setFormError("Please upload an audio file");
      return;
    }

    setFormError("");

    // Create form data for submission
    const submissionFormData = new FormData();
    submissionFormData.append("mixTitle", formData.mixTitle);
    submissionFormData.append("mixDescription", formData.mixDescription);
    submissionFormData.append("audioFile", audioFile);

    try {
      // Dispatch the submission action
      const result = await dispatch(
        submitCompetitionEntry({
          competitionId,
          formData: submissionFormData,
        })
      ).unwrap();

      // Reset form on success
      if (result.success) {
        setFormData({
          mixTitle: "",
          mixDescription: "",
        });
        setAudioFile(null);
        setSubmitSuccess(true);
      }
    } catch (error) {
      console.error("Error submitting mix:", error);
      setFormError(error.message || "Failed to submit mix. Please try again.");
    }
  };

  // If user has successfully submitted, show success message
  if (submitSuccess || submission?.success) {
    return (
      <Card
        className="border-0 shadow-sm mb-4"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        <Card.Header
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        >
          <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
            <FaMusic className="me-2" /> Your Submission
          </h5>
        </Card.Header>
        <Card.Body>
          <Alert 
            variant="success"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--accent-primary)",
              color: "var(--text-primary)"
            }}
          >
            <Alert.Heading style={{ color: "var(--accent-primary)" }}>
              Submission Successful!
            </Alert.Heading>
            <p style={{ color: "var(--text-primary)" }}>
              Your mix has been submitted to the competition successfully. Good
              luck!
            </p>
            <hr style={{ borderColor: "var(--border-color)" }} />
            <p className="mb-0" style={{ color: "var(--text-primary)" }}>
              You'll be notified when the voting phase begins.
            </p>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  // Show the upload form
  return (
    <Card
      className="border-0 shadow-sm mb-4"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <Card.Header
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-primary)",
          borderColor: "var(--border-color)",
        }}
      >
        <h5 className="mb-0" style={{ color: "var(--accent-primary)" }}>
          <FaCloudUploadAlt className="me-2" /> Submit Your Mix
        </h5>
      </Card.Header>
      <Card.Body>
        <p style={{ color: "var(--text-primary)" }}>
          Submit your mix for this competition. Make sure your mix follows all
          the competition guidelines.
        </p>

        {/* Error messages */}
        {(formError || error) && (
          <Alert 
            variant="danger" 
            className="mb-3"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "#dc3545",
              color: "var(--text-primary)"
            }}
          >
            <span style={{ color: "#dc3545" }}>
              {formError || error}
            </span>
          </Alert>
        )}

        <Form onSubmit={handleSubmit} data-testid="submission-form" id="submission-form">
          <Form.Group className="mb-3">
            <Form.Label style={{ color: "var(--text-primary)" }}>
              Mix Title *
            </Form.Label>
            <Form.Control
              type="text"
              name="mixTitle"
              value={formData.mixTitle}
              onChange={handleInputChange}
              placeholder="Enter a title for your mix"
              required
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: "var(--text-primary)" }}>
              Mix Description *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="mixDescription"
              value={formData.mixDescription}
              onChange={handleInputChange}
              placeholder="Describe your approach to this mix"
              required
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ color: "var(--text-primary)" }}>
              Audio File *
            </Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept="audio/mp3,audio/mpeg"
              required
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
            <Form.Text style={{ color: "var(--text-secondary)" }}>
              Upload your mix in MP3 format only.
            </Form.Text>
            {fileError && (
              <Alert 
                variant="danger" 
                className="mt-2 mb-0"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "#dc3545",
                  color: "var(--text-primary)"
                }}
              >
                <span style={{ color: "#dc3545" }}>
                  {fileError}
                </span>
              </Alert>
            )}
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="d-flex align-items-center"
          >
            {submitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Submitting...
              </>
            ) : (
              <>
                <FaCloudUploadAlt className="me-2" /> Submit Mix
              </>
            )}
          </Button>
        </Form>

        <div className="mt-3 small" style={{ color: "var(--text-secondary)" }}>
          <p className="mb-0">
            <strong>Note:</strong> Once submitted, you cannot change your entry.
            Please ensure your mix is finalized.
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SubmissionUploadForm;
