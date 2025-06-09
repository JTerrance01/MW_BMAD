import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Pagination,
  Badge,
  Spinner,
  Alert,
  InputGroup,
  Tab,
  Tabs,
  Row,
  Col,
  ProgressBar,
} from "react-bootstrap";
import {
  fetchAdminCompetitions,
  setPage,
  updateCompetitionStatus,
  createCompetition,
  updateCompetition,
} from "../../store/adminSlice";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaEye,
  FaChartBar,
  FaPlayCircle,
  FaPauseCircle,
  FaStopCircle,
  FaUsers,
  FaVoteYea,
  FaCogs,
  FaUser,
  FaTrophy,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import { getStatusDisplayText, getStatusStyling } from "../../utils/competitionUtils";
import axios from "axios";

const AdminCompetitionsPage = () => {
  const dispatch = useDispatch();
  const { competitions, loading, error, totalCount, currentPage, pageSize } =
    useSelector((state) => state.admin);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [votingStats, setVotingStats] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [imageFile, setImageFile] = useState(null);
  const [multitrackFile, setMultitrackFile] = useState(null);
  const [sourceTrackFile, setSourceTrackFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingVoting, setLoadingVoting] = useState(false);
  const [nonVoters, setNonVoters] = useState([]);

  // 1. Add genre options
  const GENRE_OPTIONS = [
    { value: "Unknown", label: "Unknown" },
    { value: "Pop", label: "Pop" },
    { value: "Rock", label: "Rock" },
    { value: "HipHop", label: "Hip Hop" },
    { value: "Jazz", label: "Jazz" },
    { value: "Classical", label: "Classical" },
    { value: "Electronic", label: "Electronic" },
    { value: "Country", label: "Country" },
    { value: "RnB", label: "R&B" },
    { value: "Reggae", label: "Reggae" },
    { value: "Blues", label: "Blues" },
    { value: "Metal", label: "Metal" },
    { value: "Folk", label: "Folk" },
    { value: "World", label: "World" },
    { value: "Other", label: "Other" },
  ];

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    deadline: "",
    prizeAmount: "",
    status: "Upcoming",
    rules: "",
    requirements: [""],
    imageUrl: "",
    multitrackZipUrl: "",
    sourceTrackUrl: "",
    genre: "Unknown",
    submissionDeadline: "",
    songCreator: "",
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    loadCompetitions();
  }, [dispatch, currentPage, pageSize, filterStatus, activeTab]);

  const loadCompetitions = () => {
    // Prepare filter params
    const params = {
      page: currentPage,
      pageSize,
      searchTerm: searchTerm || undefined,
      status: filterStatus || undefined,
    };

    // Add status filter based on active tab - UPDATED FOR NEW VOTING SYSTEM
    if (activeTab === "active") {
      params.status = ["OpenForSubmissions", "Upcoming", "VotingRound1Setup", "VotingRound1Open", "VotingRound1Tallying", "VotingRound2Setup", "VotingRound2Open", "VotingRound2Tallying"].join(",");
    } else if (activeTab === "finished") {
      params.status = ["Completed", "Closed", "Archived"].join(",");
    } else if (activeTab === "drafts") {
      params.status = "Cancelled";
    }

    dispatch(fetchAdminCompetitions(params));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setPage(1)); // Reset to first page on new search
    loadCompetitions();
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(setPage(1)); // Reset to first page on tab change
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRulesChange = (content) => {
    setFormData((prev) => ({ ...prev, rules: content }));
  };

  const handleRequirementChange = (index, value) => {
    const updatedRequirements = [...formData.requirements];
    updatedRequirements[index] = value;
    setFormData((prev) => ({ ...prev, requirements: updatedRequirements }));
  };

  const handleAddRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const handleRemoveRequirement = (index) => {
    const updatedRequirements = formData.requirements.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({ ...prev, requirements: updatedRequirements }));
  };

  const handleAddCompetition = () => {
    // Get today's date for startDate default
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    // Format dates for the form
    const startDateStr = today.toISOString().split("T")[0];
    const deadlineStr = nextMonth.toISOString().split("T")[0];

    // Initialize form data with a required placeholder URL
    setFormData({
      title: "",
      description: "",
      startDate: startDateStr,
      deadline: deadlineStr,
      prizeAmount: "",
      status: "Upcoming",
      rules: "",
      requirements: [""],
      imageUrl: "",
      multitrackZipUrl: "",
      sourceTrackUrl: "",
      genre: "Unknown",
      submissionDeadline: "",
      songCreator: "",
    });
    setShowAddModal(true);
  };

  const handleEditCompetition = (competition) => {
    console.log("Editing competition:", competition);
    setSelectedCompetition(competition);

    // Format dates properly for the form
    let startDateStr = "";
    let deadlineStr = "";
    let submissionDeadlineStr = "";

    try {
      // Try to format the dates properly for the date picker
      if (competition.startDate) {
        const startDate = new Date(competition.startDate);
        if (!isNaN(startDate.getTime())) {
          startDateStr = startDate.toISOString().split("T")[0];
        }
      }

      if (competition.endDate) {
        const endDate = new Date(competition.endDate);
        if (!isNaN(endDate.getTime())) {
          deadlineStr = endDate.toISOString().split("T")[0];
        }
      }

      // Format the submission deadline for the date picker
      if (competition.submissionDeadline) {
        const submissionDeadline = new Date(competition.submissionDeadline);
        if (!isNaN(submissionDeadline.getTime())) {
          submissionDeadlineStr = submissionDeadline
            .toISOString()
            .split("T")[0];
        }
      }
    } catch (error) {
      console.error("Error formatting dates:", error);
    }

    // Extract requirements from rules if they exist
    let requirements = [""];
    if (competition.rules) {
      const requirementsMatch = competition.rules.match(
        /<h3>Requirements<\/h3>\s*<ul>\s*((?:<li>.*?<\/li>\s*)*)<\/ul>/i
      );
      if (requirementsMatch && requirementsMatch[1]) {
        const requirementsHtml = requirementsMatch[1];
        const reqItems = requirementsHtml.match(/<li>(.*?)<\/li>/g);
        if (reqItems && reqItems.length > 0) {
          requirements = reqItems.map((item) => {
            return item.replace(/<li>|<\/li>/g, "");
          });
        }
      }
    }

    // Cleanup rules from requirements section for editing
    let cleanRules = competition.rules;
    if (cleanRules) {
      cleanRules = cleanRules.replace(
        /<h3>Requirements<\/h3>\s*<ul>\s*(?:<li>.*?<\/li>\s*)*<\/ul>/i,
        ""
      );
    }

    setFormData({
      title: competition.title || "",
      description: competition.description || "",
      startDate: startDateStr,
      deadline: deadlineStr,
      prizeAmount: competition.prizeDetails?.toString() || competition.prizes?.toString() || "",
      status: competition.status || "Upcoming",
      rules: cleanRules || "",
      requirements: requirements.length > 0 ? requirements : [""],
      imageUrl: competition.coverImageUrl || "",
      multitrackZipUrl: competition.multitrackZipUrl || "",
      sourceTrackUrl: competition.sourceTrackUrl || "",
      genre: competition.genre || "Unknown",
      submissionDeadline: submissionDeadlineStr,
      songCreator: competition.songCreator || "",
    });

    // Reset the image and multitrack file states when editing
    setImageFile(null);
    setMultitrackFile(null);
    setSourceTrackFile(null);

    setShowEditModal(true);
  };

  const handleUpdateStatus = async (competitionId, newStatus) => {
    if (
      window.confirm(
        `Are you sure you want to change the status to ${newStatus}?`
      )
    ) {
      console.log(
        `Updating competition ${competitionId} status to ${newStatus}`
      );
      setSubmitting(true);

      // Find the competition row and add a pending indicator
      const statusCell = document.querySelector(
        `tr[data-competition-id="${competitionId}"] td:nth-child(2)`
      );
      if (statusCell) {
        const originalContent = statusCell.innerHTML;
        statusCell.innerHTML = `<span class="text-warning">Updating...</span>`;

        // Store original content for restoration if needed
        statusCell.dataset.originalContent = originalContent;
      }

      try {
        // ENHANCED: Check for Round 2 Setup to Open transition
        if (newStatus === "VotingRound2Open") {
          // UNIFIED APPROACH: Call Round2VotingController setup endpoint for Round 2 transitions
          console.log(`🔄 Round 2 transition detected - calling Round2VotingController setup endpoint`);
          
          const token = localStorage.getItem("token");
          const response = await axios.post(
            `https://localhost:7001/api/competitions/${competitionId}/round2/setup`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.success) {
            // Success case
            if (statusCell) {
              statusCell.innerHTML = `<span class="text-success">✓ ${response.data.message}</span>`;
            }

            console.log(`✅ Round 2 setup completed: ${response.data.message}`);

            // Reload the competitions data after a short delay
            setTimeout(() => {
              loadCompetitions();
            }, 1500);
          }
        } else {
          // Use existing Redux action for other status transitions
          const result = await dispatch(
            updateCompetitionStatus({
              competitionId,
              status: newStatus,
            })
          );

          console.log("Status update result:", result);

          if (result.error) {
            // Show error message if the update failed
            console.error("Status update failed:", result.error);
            alert(
              `Failed to update status: ${
                result.error.message || "Unknown error"
              }`
            );

            // Restore original status display
            if (statusCell && statusCell.dataset.originalContent) {
              statusCell.innerHTML = statusCell.dataset.originalContent;
            }
          } else {
            // Success case
            if (statusCell) {
              statusCell.innerHTML = `<span class="text-success">✓ Updated to ${newStatus}!</span>`;
            }

            // Show success message
            const message = `Competition status successfully updated to ${newStatus}`;
            console.log(message);

            // Reload the competitions data after a short delay
            setTimeout(() => {
              loadCompetitions();
            }, 1500);
          }
        }
      } catch (error) {
        console.error("Error updating competition status:", error);
        
        // Enhanced error messaging for Round 2 transitions
        let errorMessage = "Unknown error";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
          errorMessage = "Competition not in correct status for this transition";
        } else if (error.response?.status === 404) {
          errorMessage = "Competition or endpoint not found";
        } else if (error.response?.status === 405) {
          errorMessage = "Method not allowed - routing issue detected";
        } else {
          errorMessage = error.message || "Network or server error";
        }
        
        alert(`Error updating status: ${errorMessage}`);

        // Restore original status display
        if (statusCell && statusCell.dataset.originalContent) {
          statusCell.innerHTML = statusCell.dataset.originalContent;
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Show loading
    setSubmitting(true);

    try {
      // Determine if this is a new competition or an update
      const isUpdate = showEditModal && selectedCompetition;

      // Validate required fields - only for new competitions
      if (!isUpdate) {
        // Only validate all required fields for new competitions
        if (
          !formData.title ||
          !formData.description ||
          !formData.startDate ||
          !formData.deadline ||
          !formData.rules ||
          !formData.prizeAmount ||
          !formData.genre ||
          !formData.submissionDeadline ||
          !formData.songCreator
        ) {
          alert(
            "Please fill in all required fields: Title, Description, Rules, Prize Amount, Genre, Submission Deadline, and Song Creator."
          );
          setSubmitting(false);
          return;
        }
      } else {
        // For updates, only validate fields that must always be present
        if (!formData.title || !formData.description) {
          alert("Title and Description are required fields even for updates.");
          setSubmitting(false);
          return;
        }
      }

      // Add input validation that properly checks for multitrack requirements
      if (!hasValidMultitrackSource() && !isUpdate) {
        // Only require multitrack for new competitions
        alert("Please upload a multitrack ZIP file");
        setSubmitting(false);
        return;
      }

      // Add input validation for source track requirements
      if (!hasValidSourceTrack() && !isUpdate) {
        // Only require source track for new competitions
        alert("Please upload a source track file");
        setSubmitting(false);
        return;
      }

      // Validate and parse dates if provided
      if (formData.startDate && formData.deadline) {
        let startDate, endDate;

        try {
          // Format dates using a reliable method for date parsing
          const [startYear, startMonth, startDay] = formData.startDate
            .split("-")
            .map(Number);
          startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);

          const [endYear, endMonth, endDay] = formData.deadline
            .split("-")
            .map(Number);
          endDate = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);

          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid date format");
          }

          // Check if end date is after start date
          if (endDate < startDate) {
            alert("Deadline must be after the start date");
            setSubmitting(false);
            return;
          }
        } catch (error) {
          alert("Please enter valid dates in the format YYYY-MM-DD");
          setSubmitting(false);
          return;
        }
      }

      // Prepare form data for multipart/form-data submission
      const formDataObj = new FormData();

      // Add basic competition data with explicit checks for null/undefined
      formDataObj.append("Title", formData.title.trim());
      formDataObj.append("Description", formData.description.trim());

      // Add OrganizerUserId - this was missing and causing validation failures
      // Use the current user's ID from localStorage if available
      const userId = localStorage.getItem("userId") || "system";
      formDataObj.append("OrganizerUserId", userId);

      // Add requirements if present and not empty
      if (formData.requirements && formData.requirements.length > 0) {
        formData.requirements.forEach((req, index) => {
          if (req && req.trim() !== "") {
            formDataObj.append("Requirements", req.trim());
          }
        });
      }

      // Add rules if present
      if (formData.rules) {
        formDataObj.append("Rules", formData.rules);
      } else {
        formDataObj.append("Rules", ""); // Send empty string if no rules
      }

      // Make sure prizeAmount is a string and not empty
      const prizeAmount = formData.prizeAmount
        ? formData.prizeAmount.toString().trim()
        : "";
      formDataObj.append("PrizeDetails", prizeAmount);
      formDataObj.append("Status", formData.status);

      // Format dates correctly for API - with proper timezone handling
      if (formData.startDate) {
        const startDate = new Date(formData.startDate);
        if (!isNaN(startDate.getTime())) {
          formDataObj.append("StartDate", startDate.toISOString());
        }
      }

      if (formData.deadline) {
        const endDate = new Date(formData.deadline);
        if (!isNaN(endDate.getTime())) {
          formDataObj.append("EndDate", endDate.toISOString());
        }
      }

      // Format the submission deadline properly for the API
      if (formData.submissionDeadline) {
        const submissionDeadline = new Date(formData.submissionDeadline);
        if (!isNaN(submissionDeadline.getTime())) {
          formDataObj.append(
            "SubmissionDeadline",
            submissionDeadline.toISOString()
          );
        }
      }

      // Add Genre and SongCreator
      formDataObj.append("Genre", formData.genre);
      formDataObj.append(
        "SongCreator",
        formData.songCreator ? formData.songCreator.trim() : ""
      );

      // Handle image file and URL
      if (imageFile) {
        formDataObj.append("CoverImage", imageFile);
        console.log(
          `Cover image added: ${imageFile.name} (${imageFile.size} bytes, type: ${imageFile.type})`
        );
      }

      // Handle ImageUrl - important for updates to maintain existing images
      if (isUpdate && selectedCompetition?.coverImageUrl && !imageFile) {
        formDataObj.append("ImageUrl", selectedCompetition.coverImageUrl);
        console.log(
          `Using existing cover image URL: ${selectedCompetition.coverImageUrl}`
        );
      } else if (formData.imageUrl) {
        formDataObj.append("ImageUrl", formData.imageUrl);
        console.log(`Using specified image URL: ${formData.imageUrl}`);
      }

      // Handle multitrack zip file
      if (multitrackFile) {
        // If file is provided, add the file and a placeholder URL
        formDataObj.append("MultitrackZipFile", multitrackFile);
        formDataObj.append("MultitrackZipUrl", "FILE_UPLOAD_PLACEHOLDER");
        console.log(
          `Multitrack zip added: ${multitrackFile.name} (${multitrackFile.size} bytes, type: ${multitrackFile.type})`
        );
      } else if (!isUpdate) {
        // Only show this error for new competitions
        alert("Please provide a multitrack ZIP file");
        setSubmitting(false);
        return;
      } else if (isUpdate && selectedCompetition?.multitrackZipUrl) {
        // For updates, use the existing multitrack URL if no new file is provided
        formDataObj.append(
          "MultitrackZipUrl",
          selectedCompetition.multitrackZipUrl
        );
        console.log(
          `Keeping existing multitrack URL: ${selectedCompetition.multitrackZipUrl}`
        );
      }

      // Handle source track file (required for new competitions)
      if (sourceTrackFile) {
        // If file is provided, add the file and a placeholder URL
        formDataObj.append("SourceTrackFile", sourceTrackFile);
        formDataObj.append("SourceTrackUrl", "FILE_UPLOAD_PLACEHOLDER");
        console.log(
          `Source track added: ${sourceTrackFile.name} (${sourceTrackFile.size} bytes, type: ${sourceTrackFile.type})`
        );
      } else if (isUpdate && selectedCompetition?.sourceTrackUrl) {
        // For updates, use the existing source track URL if no new file is provided
        formDataObj.append(
          "SourceTrackUrl",
          selectedCompetition.sourceTrackUrl
        );
        console.log(
          `Keeping existing source track URL: ${selectedCompetition.sourceTrackUrl}`
        );
      }

      // Log the form data for debugging
      console.log("FormData contents:");
      for (let [key, value] of formDataObj.entries()) {
        console.log(
          `${key}: ${
            value instanceof File
              ? `${value.name} (${value.size} bytes, type: ${value.type})`
              : value
          }`
        );
      }

      // Create a controller to allow for cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // Abort after 5 minutes

      try {
        // Dispatch the appropriate action based on whether we're adding or editing
        if (isUpdate) {
          console.log("Updating competition:", selectedCompetition.id);

          // Add the competition ID to the form data
          formDataObj.append("CompetitionId", selectedCompetition.id);

          // Log the complete form data for debugging before sending
          console.log("FormData contents for update:");
          for (let [key, value] of formDataObj.entries()) {
            console.log(
              `${key}: ${
                value instanceof File
                  ? `${value.name} (${value.size} bytes)`
                  : value
              }`
            );
          }

          // Dispatch the updateCompetition action
          console.log("Dispatching updateCompetition action...");
          try {
            const response = await dispatch(
              updateCompetition({
                competitionId: selectedCompetition.id,
                competitionData: formDataObj,
              })
            ).unwrap();

            clearTimeout(timeoutId);
            console.log("Update response:", response);
            // Success
            setShowEditModal(false);
            loadCompetitions();
            alert("Competition updated successfully");
          } catch (updateError) {
            clearTimeout(timeoutId);
            console.error("Competition update failed:", updateError);

            // Add more detailed error logging
            if (updateError?.response?.data) {
              console.error("Server response:", updateError.response.data);
            }

            throw updateError; // Rethrow to be caught by the outer try/catch
          }
        } else {
          console.log("Dispatching createCompetition action...");
          console.log(
            "FormData payload:",
            Object.fromEntries(formDataObj.entries())
          );

          const result = await dispatch(
            createCompetition(formDataObj)
          ).unwrap();

          // Success
          clearTimeout(timeoutId);
          console.log("Competition created successfully:", result);
          setShowAddModal(false);
          loadCompetitions();
          alert("Competition created successfully");
        }
      } catch (error) {
        // Error handling
        clearTimeout(timeoutId);
        console.error("Operation error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));

        // Show more detailed error message
        let errorMessage = isUpdate
          ? "Failed to update competition"
          : "Failed to create competition";

        // Handle different error formats safely
        if (typeof error === "string") {
          errorMessage += `: ${error}`;
        } else if (error?.message) {
          errorMessage += `: ${error.message}`;
        }

        // The error.errors handling code can be removed now that adminSlice.js returns strings
        // This is just defensive coding in case any errors slip through
        if (error?.errors && typeof error.errors === "object") {
          try {
            const validationErrors = [];
            for (const field in error.errors) {
              const fieldErrors = Array.isArray(error.errors[field])
                ? error.errors[field].join(", ")
                : error.errors[field];
              validationErrors.push(`${field}: ${fieldErrors}`);
            }
            if (validationErrors.length > 0) {
              errorMessage += `\n\nValidation errors:\n${validationErrors.join(
                "\n"
              )}`;
            }
          } catch (parsingError) {
            console.error("Error parsing validation errors:", parsingError);
            errorMessage += "\n\nUnable to parse validation errors";
          }
        }

        alert(errorMessage);
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        "An error occurred while processing your request. Please try again."
      );
      setSubmitting(false);
    }
  };

  // Add a file input handler
  const handleFileChange = (e) => {
    const { files, name } = e.target;
    if (files.length > 0) {
      if (name === "coverImage") {
        setImageFile(files[0]);
      } else if (name === "multitrackZip") {
        setMultitrackFile(files[0]);
      } else if (name === "sourceTrack") {
        setSourceTrackFile(files[0]);
      }
    }
  };

  // Helper to check if multitrack requirements are met
  const hasValidMultitrackSource = () => {
    // Determine if this is an update
    const isUpdate = showEditModal && selectedCompetition;

    // For new competitions, require a file
    if (!isUpdate) {
      return multitrackFile !== null;
    }

    // For updates, either a new file or existing URL is valid
    return (
      multitrackFile !== null ||
      (selectedCompetition?.multitrackZipUrl &&
        selectedCompetition.multitrackZipUrl.trim() !== "")
    );
  };

  const hasValidSourceTrack = () => {
    // Determine if this is an update
    const isUpdate = showEditModal && selectedCompetition;

    // For new competitions, require a file
    if (!isUpdate) {
      return sourceTrackFile !== null;
    }

    // For updates, either a new file or existing URL is valid
    return (
      sourceTrackFile !== null ||
      (selectedCompetition?.sourceTrackUrl &&
        selectedCompetition.sourceTrackUrl.trim() !== "")
    );
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "OpenForSubmissions":
        return "success";
      case "Upcoming":
        return "info";
      case "Cancelled":
        return "secondary";
      case "Closed":
        return "dark";
      case "InJudging":
        return "warning";
      default:
        return "primary";
    }
  };

  // Generate pagination items
  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <Pagination.Item
        key={i}
        active={i === currentPage}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </Pagination.Item>
    );
  }

  // UPDATED STATUS OPTIONS - REMOVED LEGACY "InJudging"
  const StatusOptions = () => (
    <>
      <option value="Upcoming">Upcoming</option>
      <option value="OpenForSubmissions">Open For Submissions</option>
      <option value="VotingRound1Setup">Voting Round 1 Setup</option>
      <option value="VotingRound1Open">Voting Round 1 Open</option>
      <option value="VotingRound1Tallying">Voting Round 1 Tallying</option>
      <option value="VotingRound2Setup">Voting Round 2 Setup</option>
      <option value="VotingRound2Open">Voting Round 2 Open</option>
      <option value="VotingRound2Tallying">Voting Round 2 Tallying</option>
      <option value="Completed">Completed</option>
      <option value="Closed">Closed</option>
      <option value="Cancelled">Cancelled</option>
    </>
  );

  // 1. Add a delete handler:
  const handleDeleteCompetition = async (competitionId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this competition? This action cannot be undone."
      )
    )
      return;
    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/v1/admin/competitions/${competitionId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (result.success) {
        alert("Competition deleted successfully.");
        loadCompetitions();
      } else {
        alert(result.message || "Failed to delete competition.");
      }
    } catch (error) {
      alert("An error occurred while deleting the competition.");
    } finally {
      setSubmitting(false);
    }
  };

  // NEW VOTING SYSTEM FUNCTIONALITY
  const handleSetupVoting = async (competition) => {
    setSelectedCompetition(competition);
    setLoadingVoting(true);
    try {
      // First transition to VotingRound1Setup if needed
      if (competition.status === "OpenForSubmissions") {
        await updateCompetitionStatusDirect(competition.id, "VotingRound1Setup");
      }
      
      // Load voting stats
      await loadVotingStats(competition.id);
      await loadNonVoters(competition.id);
      setShowVotingModal(true);
    } catch (error) {
      console.error("Error setting up voting:", error);
      alert(`Error setting up voting: ${error.message}`);
    } finally {
      setLoadingVoting(false);
    }
  };

  const handleCreateVotingGroups = async (competitionId, targetGroupSize = 20) => {
    setLoadingVoting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://localhost:7001/api/competitions/${competitionId}/round1/create-groups`,
        { targetGroupSize },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        // Refresh voting stats after creating groups
        await loadVotingStats(competitionId);
        await loadNonVoters(competitionId);
      }
    } catch (error) {
      console.error("Error creating voting groups:", error);
      alert(`❌ Error creating voting groups: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoadingVoting(false);
    }
  };

  const handleOpenVoting = async (competitionId) => {
    setLoadingVoting(true);
    try {
      await updateCompetitionStatusDirect(competitionId, "VotingRound1Open");
      alert("✅ Competition is now open for Round 1 voting!");
      setShowVotingModal(false);
      await loadCompetitions();
    } catch (error) {
      console.error("Error opening voting:", error);
      alert(`❌ Error opening voting: ${error.message}`);
    } finally {
      setLoadingVoting(false);
    }
  };

  const loadVotingStats = async (competitionId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://localhost:7001/api/competitions/${competitionId}/round1/voting-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('📊 Voting Stats Response:', response.data);
      setVotingStats(response.data);
    } catch (error) {
      console.error("Error loading voting stats:", error);
      // Set default stats instead of null to prevent display issues
      setVotingStats({
        totalVoters: 0,
        votersCompleted: 0,
        votingCompletionPercentage: 0,
        groupCount: 0,
        groupStats: []
      });
    }
  };

  const loadNonVoters = async (competitionId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://localhost:7001/api/competitions/${competitionId}/round1/non-voters`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('👥 Non-Voters Response:', response.data);
      setNonVoters(response.data || []);
    } catch (error) {
      console.error("Error loading non-voters:", error);
      // Set empty array on error to prevent display issues
      setNonVoters([]);
    }
  };

  const updateCompetitionStatusDirect = async (competitionId, newStatus) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(
      `https://localhost:7001/api/v1/admin/competitions/${competitionId}/status`,
      { newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  };

  const handleTallyVotes = async (competitionId) => {
    if (!window.confirm("Are you sure you want to tally votes and advance submissions to Round 2? This action cannot be undone.")) {
      return;
    }

    setLoadingVoting(true);
    try {
      const token = localStorage.getItem("token");
      
      // FIXED: Direct call to correct Round1AssignmentController endpoint
      // The backend endpoint already handles status validation and auto-transition
      const response = await axios.post(
        `https://localhost:7001/api/competitions/${competitionId}/round1/tally-votes`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        setShowVotingModal(false);
        await loadCompetitions();
      }
    } catch (error) {
      console.error("Error tallying votes:", error);
      
      // Enhanced error messaging for better debugging
      if (error.response?.status === 400) {
        alert(`❌ Error: ${error.response.data.message || 'Competition not in correct status for tallying votes'}`);
      } else if (error.response?.status === 404) {
        alert(`❌ Error: Competition or endpoint not found. Please check the competition ID.`);
      } else if (error.response?.status === 405) {
        alert(`❌ Error: Method not allowed. This indicates a routing issue.`);
      } else {
        alert(`❌ Error tallying votes: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoadingVoting(false);
    }
  };

  // NEW: Handle Round 2 vote tallying
  const handleTallyRound2Votes = async (competitionId) => {
    if (!window.confirm("Are you sure you want to tally Round 2 votes and determine the competition winner? This action cannot be undone.")) {
      return;
    }

    setLoadingVoting(true);
    try {
      const token = localStorage.getItem("token");
      
      // Call Round2VotingController tally-votes endpoint
      const response = await axios.post(
        `https://localhost:7001/api/competitions/${competitionId}/round2/tally-votes`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        if (response.data.requiresManualSelection) {
          // Handle tie scenario - competition moved to RequiresManualWinnerSelection status
          alert(`⚖️ ${response.data.message}\n\nThe competition status has been updated to require manual winner selection.`);
        } else {
          // Handle clear winner scenario - competition completed
          alert(`🏆 ${response.data.message}\n\nThe competition has been completed successfully!`);
        }
        setShowVotingModal(false);
        await loadCompetitions();
      }
    } catch (error) {
      console.error("Error tallying Round 2 votes:", error);
      
      // Enhanced error messaging for Round 2 tallying
      if (error.response?.status === 400) {
        alert(`❌ Error: ${error.response.data.message || 'Competition not in correct status for Round 2 tallying'}`);
      } else if (error.response?.status === 404) {
        alert(`❌ Error: Competition or Round 2 tallying endpoint not found.`);
      } else if (error.response?.status === 405) {
        alert(`❌ Error: Method not allowed. Check Round 2 tallying endpoint routing.`);
      } else {
        alert(`❌ Error tallying Round 2 votes: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoadingVoting(false);
    }
  };

  return (
    <div className="admin-content">
      <h1 className="mb-4">Competition Management</h1>
      {error && (
        <Alert variant="danger" className="mb-4">
          {typeof error === "object"
            ? error.message || JSON.stringify(error)
            : error}
        </Alert>
      )}
      <Card className="mb-4 bg-dark text-light">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Form
              onSubmit={handleSearch}
              className="d-flex"
              style={{ width: "300px" }}
            >
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search competitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark text-light border-secondary"
                />
                <Button type="submit" variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            <Button
              variant="success"
              className="ms-auto"
              onClick={handleAddCompetition}
            >
              <FaPlus className="me-2" /> New Competition
            </Button>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4"
          >
            <Tab eventKey="active" title="Active Competitions">
              {renderCompetitionsTable()}
            </Tab>
            <Tab eventKey="finished" title="Finished Competitions">
              {renderCompetitionsTable()}
            </Tab>
            <Tab eventKey="drafts" title="Drafts">
              {renderCompetitionsTable()}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
      {/* Add Competition Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        backdrop="static"
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="text-primary">
            Add New Competition
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="bg-dark text-light border-secondary"
                    placeholder="Enter competition title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="bg-dark text-light border-secondary"
                  >
                    <StatusOptions />
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="bg-dark text-light border-secondary"
                placeholder="Describe your competition"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    min="2000-01-01"
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Format: YYYY-MM-DD
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Deadline</Form.Label>
                  <Form.Control
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    min="2000-01-01"
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Format: YYYY-MM-DD
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Prize Amount ($)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="prizeAmount"
                    value={formData.prizeAmount}
                    onChange={handleInputChange}
                    required
                    className="bg-dark text-light border-secondary"
                    placeholder="Enter prize amount"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Cover Image</Form.Label>
              <Form.Control
                type="file"
                name="coverImage"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                className="bg-dark text-light border-secondary"
              />
              <Form.Text className="text-muted">
                Maximum file size: 5MB. Supported formats: JPG, PNG
              </Form.Text>
              {formData.imageUrl && (
                <small className="text-muted d-block mt-1">
                  Current image: {formData.imageUrl}
                </small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">
                Multi-track ZIP File{" "}
                <span className="text-danger">
                  (Required if no URL provided)
                </span>
              </Form.Label>
              <Form.Control
                type="file"
                name="multitrackZip"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileChange}
                className={`bg-dark text-light ${
                  !hasValidMultitrackSource()
                    ? "border-danger"
                    : "border-secondary"
                }`}
              />
              <Form.Text className="text-muted">
                Upload a ZIP file containing multi-track audio files for the
                competition. Maximum size: 1GB.
              </Form.Text>

              {selectedCompetition?.multitrackZipUrl && (
                <div className="mt-2 mb-2">
                  <Form.Label className="text-light">
                    Current Multitrack File
                  </Form.Label>
                  <div className="bg-dark border border-secondary rounded p-2">
                    <small className="text-info">
                      {selectedCompetition.multitrackZipUrl}
                    </small>
                  </div>
                  <small className="text-muted">
                    To replace, upload a new file above
                  </small>
                </div>
              )}

              {!hasValidMultitrackSource() && (
                <small className="text-danger d-block mt-1">
                  <strong>Required:</strong> You must upload a multitrack ZIP file
                </small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">
                Source Track File{" "}
                <span className="text-danger">
                  (Required)
                </span>
              </Form.Label>
              <Form.Control
                type="file"
                name="sourceTrack"
                accept=".mp3,audio/mpeg,audio/mp3,.wav,audio/wav,audio/wave"
                onChange={handleFileChange}
                className={`bg-dark text-light ${
                  !hasValidSourceTrack()
                    ? "border-danger"
                    : "border-secondary"
                }`}
              />
              <Form.Text className="text-muted">
                Upload a source track file for users to download and use in mixing. Maximum size: 50MB.
              </Form.Text>

              {selectedCompetition?.sourceTrackUrl && (
                <div className="mt-2 mb-2">
                  <Form.Label className="text-light">
                    Current Source Track File
                  </Form.Label>
                  <div className="bg-dark border border-secondary rounded p-2">
                    <small className="text-info">
                      {selectedCompetition.sourceTrackUrl}
                    </small>
                  </div>
                  <small className="text-muted">
                    To replace, upload a new file above
                  </small>
                </div>
              )}

              {!hasValidSourceTrack() && (
                <small className="text-danger d-block mt-1">
                  <strong>Required:</strong> You must upload a source track file
                </small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Genre</Form.Label>
              <Form.Select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                required
                className="bg-dark text-light border-secondary"
              >
                {GENRE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Submission Deadline
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="submissionDeadline"
                    value={formData.submissionDeadline}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate}
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Must be after the start date
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Song Creator(s)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="songCreator"
                    value={formData.songCreator}
                    onChange={handleInputChange}
                    placeholder="List of artists, writers, producers (comma-separated)"
                    className="bg-dark text-light border-secondary"
                    maxLength={500}
                    required
                  />
                  <Form.Text className="text-muted">
                    Comma-separated list of artists, writers, and producers
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Competition Rules</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="rules"
                value={formData.rules}
                onChange={(e) => handleRulesChange(e.target.value)}
                required
                placeholder="Enter competition rules and guidelines"
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Requirements</Form.Label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={req}
                    onChange={(e) =>
                      handleRequirementChange(index, e.target.value)
                    }
                    placeholder={`Requirement #${index + 1}`}
                    className="bg-dark text-light border-secondary"
                  />
                  <Button
                    variant="outline-danger"
                    className="ms-2"
                    onClick={() => handleRemoveRequirement(index)}
                    disabled={formData.requirements.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleAddRequirement}
                className="mt-2"
              >
                Add Requirement
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
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
                Creating...
              </>
            ) : (
              "Create Competition"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Edit Competition Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        backdrop="static"
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="text-primary">
            Edit Competition: {selectedCompetition?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="bg-dark text-light border-secondary"
                    placeholder="Enter competition title"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="bg-dark text-light border-secondary"
                  >
                    <StatusOptions />
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="bg-dark text-light border-secondary"
                placeholder="Describe your competition"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    min="2000-01-01"
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Format: YYYY-MM-DD
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Deadline</Form.Label>
                  <Form.Control
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    min="2000-01-01"
                    pattern="\d{4}-\d{2}-\d{2}"
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Format: YYYY-MM-DD
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Prize Amount ($)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="prizeAmount"
                    value={formData.prizeAmount}
                    onChange={handleInputChange}
                    required
                    className="bg-dark text-light border-secondary"
                    placeholder="Enter prize amount"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Cover Image</Form.Label>
              <Form.Control
                type="file"
                name="coverImage"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileChange}
                className="bg-dark text-light border-secondary"
              />
              <Form.Text className="text-muted">
                Maximum file size: 5MB. Supported formats: JPG, PNG
              </Form.Text>
              {formData.imageUrl && (
                <small className="text-muted d-block mt-1">
                  Current image: {formData.imageUrl}
                </small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">
                Multi-track ZIP File{" "}
                <span className="text-danger">
                  (Required if no URL provided)
                </span>
              </Form.Label>
              <Form.Control
                type="file"
                name="multitrackZip"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileChange}
                className={`bg-dark text-light ${
                  !hasValidMultitrackSource()
                    ? "border-danger"
                    : "border-secondary"
                }`}
              />
              <Form.Text className="text-muted">
                Upload a ZIP file containing multi-track audio files for the
                competition. Maximum size: 1GB.
              </Form.Text>

              {selectedCompetition?.multitrackZipUrl && (
                <div className="mt-2 mb-2">
                  <Form.Label className="text-light">
                    Current Multitrack File
                  </Form.Label>
                  <div className="bg-dark border border-secondary rounded p-2">
                    <small className="text-info">
                      {selectedCompetition.multitrackZipUrl}
                    </small>
                  </div>
                  <small className="text-muted">
                    To replace, upload a new file above
                  </small>
                </div>
              )}

              {!hasValidMultitrackSource() && (
                <small className="text-danger d-block mt-1">
                  <strong>Required:</strong> You must upload a multitrack ZIP file
                </small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">
                Source Track File{" "}
                <span className="text-danger">
                  (Required)
                </span>
              </Form.Label>
              <Form.Control
                type="file"
                name="sourceTrack"
                accept=".mp3,audio/mpeg,audio/mp3,.wav,audio/wav,audio/wave"
                onChange={handleFileChange}
                className={`bg-dark text-light ${
                  !hasValidSourceTrack()
                    ? "border-danger"
                    : "border-secondary"
                }`}
              />
              <Form.Text className="text-muted">
                Upload a source track file for users to download and use in mixing. Maximum size: 50MB.
              </Form.Text>

              {selectedCompetition?.sourceTrackUrl && (
                <div className="mt-2 mb-2">
                  <Form.Label className="text-light">
                    Current Source Track File
                  </Form.Label>
                  <div className="bg-dark border border-secondary rounded p-2">
                    <small className="text-info">
                      {selectedCompetition.sourceTrackUrl}
                    </small>
                  </div>
                  <small className="text-muted">
                    To replace, upload a new file above
                  </small>
                </div>
              )}

              {!hasValidSourceTrack() && (
                <small className="text-danger d-block mt-1">
                  <strong>Required:</strong> You must upload a source track file
                </small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Genre</Form.Label>
              <Form.Select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                required
                className="bg-dark text-light border-secondary"
              >
                {GENRE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Submission Deadline
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="submissionDeadline"
                    value={formData.submissionDeadline}
                    onChange={handleInputChange}
                    required
                    min={formData.startDate}
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Must be after the start date
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Song Creator(s)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="songCreator"
                    value={formData.songCreator}
                    onChange={handleInputChange}
                    placeholder="List of artists, writers, producers (comma-separated)"
                    className="bg-dark text-light border-secondary"
                    maxLength={500}
                    required
                  />
                  <Form.Text className="text-muted">
                    Comma-separated list of artists, writers, and producers
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Competition Rules</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="rules"
                value={formData.rules}
                onChange={(e) => handleRulesChange(e.target.value)}
                required
                placeholder="Enter competition rules and guidelines"
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Requirements</Form.Label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={req}
                    onChange={(e) =>
                      handleRequirementChange(index, e.target.value)
                    }
                    placeholder={`Requirement #${index + 1}`}
                    className="bg-dark text-light border-secondary"
                  />
                  <Button
                    variant="outline-danger"
                    className="ms-2"
                    onClick={() => handleRemoveRequirement(index)}
                    disabled={formData.requirements.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleAddRequirement}
                className="mt-2"
              >
                Add Requirement
              </Button>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
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
                Updating...
              </>
            ) : (
              "Update Competition"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Voting Management Modal */}
      <Modal
        show={showVotingModal}
        onHide={() => setShowVotingModal(false)}
        size="lg"
        backdrop="static"
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="text-primary">
            Voting Management - {selectedCompetition?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCompetition && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="bg-secondary text-light h-100">
                    <Card.Body>
                      <Card.Title>Competition Status</Card.Title>
                      <Badge bg={getStatusBadgeColor(selectedCompetition.status)} className="fs-6">
                        {getStatusDisplayText(selectedCompetition.status)}
                      </Badge>
                      <div className="mt-2">
                        <small className="text-muted">
                          Submissions: {selectedCompetition.numberOfSubmissions || 0}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  {votingStats && (
                    <Card className="bg-secondary text-light h-100">
                      <Card.Body>
                        <Card.Title>Voting Progress</Card.Title>
                        
                        {/* Show warning if voting setup is incomplete */}
                        {(votingStats.groupCount === 0 || votingStats.totalVoters === 0) && 
                         selectedCompetition.status === "VotingRound1Open" && (
                          <Alert variant="warning" className="mb-3 py-2">
                            <small>
                              <strong>⚠️ Setup Incomplete:</strong> Voting groups need to be created.
                            </small>
                          </Alert>
                        )}
                        
                        <div className="mb-2">
                          <small className="text-muted">
                            Groups Created: {votingStats.groupCount || 0}
                            {votingStats.groupCount === 0 && (
                              <span className="text-warning ms-1">⚠️</span>
                            )}
                          </small>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">
                            Voters: {votingStats.votersCompleted || 0} / {votingStats.totalVoters || 0}
                            {votingStats.totalVoters === 0 && (
                              <span className="text-warning ms-1">⚠️</span>
                            )}
                          </small>
                        </div>
                        <ProgressBar 
                          now={votingStats.votingCompletionPercentage || 0} 
                          label={`${Math.round(votingStats.votingCompletionPercentage || 0)}%`}
                          variant={votingStats.totalVoters === 0 ? "warning" : "info"}
                        />
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>

              {/* Non-Voters List Section */}
              {nonVoters && nonVoters.length > 0 && (
                <Row className="mb-4">
                  <Col md={12}>
                    <Card className="bg-warning text-dark">
                      <Card.Body>
                        <Card.Title className="d-flex justify-content-between align-items-center">
                          <span>⚠️ Users Who Haven't Voted</span>
                          <Badge bg="dark" className="fs-6">
                            {nonVoters.length} remaining
                          </Badge>
                        </Card.Title>
                        <div className="mt-3">
                          {nonVoters.length <= 10 ? (
                            // Show all users if 10 or fewer
                            <div className="row">
                              {nonVoters.map((nonVoter, index) => (
                                <div key={index} className="col-md-6 col-lg-4 mb-2">
                                  <div className="d-flex align-items-center bg-light rounded p-2">
                                    <FaUser className="me-2 text-muted" />
                                    <div>
                                      <div className="fw-bold text-truncate" style={{ maxWidth: '150px' }}>
                                        {nonVoter.voterUsername}
                                      </div>
                                      <small className="text-muted">
                                        Group {nonVoter.assignedGroupNumber}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Show condensed list if more than 10 users
                            <div>
                              <div className="row mb-3">
                                {nonVoters.slice(0, 9).map((nonVoter, index) => (
                                  <div key={index} className="col-md-4 col-lg-3 mb-2">
                                    <div className="d-flex align-items-center bg-light rounded p-2">
                                      <FaUser className="me-2 text-muted" />
                                      <div>
                                        <div className="fw-bold text-truncate" style={{ maxWidth: '120px' }}>
                                          {nonVoter.voterUsername}
                                        </div>
                                        <small className="text-muted">
                                          Group {nonVoter.assignedGroupNumber}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {nonVoters.length > 9 && (
                                <div className="text-center">
                                  <Badge bg="dark" className="fs-6 px-3 py-2">
                                    ... and {nonVoters.length - 9} more users
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              <div className="d-flex flex-column gap-3">
                {selectedCompetition.status === "OpenForSubmissions" && (
                  <Alert variant="info">
                    <strong>Next Step:</strong> Transition to voting setup phase and create voting groups.
                  </Alert>
                )}

                {selectedCompetition.status === "VotingRound1Setup" && (
                  <>
                    {votingStats?.groupCount > 0 ? (
                      <Alert variant="success">
                        <strong>Groups Created:</strong> Voting groups are ready. You can now open voting.
                      </Alert>
                    ) : (
                      <Alert variant="warning">
                        <strong>Setup Required:</strong> Create voting groups before opening voting.
                      </Alert>
                    )}
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleCreateVotingGroups(selectedCompetition.id)}
                        disabled={loadingVoting || votingStats?.groupCount > 0}
                        title={votingStats?.groupCount > 0 ? "Voting groups already created" : "Create voting groups for this competition"}
                      >
                        {loadingVoting ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Creating Groups...
                          </>
                        ) : (
                          <>
                            <FaUsers className="me-2" />
                            {votingStats?.groupCount > 0 ? "✅ Groups Created" : "Create Voting Groups"}
                          </>
                        )}
                      </Button>
                      {votingStats?.groupCount > 0 && (
                        <Button
                          variant="success"
                          onClick={() => handleOpenVoting(selectedCompetition.id)}
                          disabled={loadingVoting}
                        >
                          <FaVoteYea className="me-2" />
                          Open Voting
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {selectedCompetition.status === "VotingRound1Open" && (
                  <>
                    {/* Show setup action if groups missing */}
                    {votingStats?.groupCount === 0 ? (
                      <>
                        <Alert variant="danger">
                          <strong>🚨 Critical Issue:</strong> Voting is open but no groups exist! Create voting groups immediately.
                        </Alert>
                        <div className="d-flex gap-2">
                          <Button
                            variant="danger"
                            onClick={() => handleCreateVotingGroups(selectedCompetition.id)}
                            disabled={loadingVoting}
                            size="lg"
                          >
                            {loadingVoting ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Creating Groups...
                              </>
                            ) : (
                              <>
                                <FaUsers className="me-2" />
                                🚨 Create Voting Groups Now
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline-info"
                            onClick={() => {
                              loadVotingStats(selectedCompetition.id);
                              loadNonVoters(selectedCompetition.id);
                            }}
                            disabled={loadingVoting}
                          >
                            Refresh Stats
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Alert variant="success">
                          <strong>Voting Active:</strong> Users can now vote on submissions. Monitor progress below.
                        </Alert>
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            variant="warning"
                            onClick={() => handleTallyVotes(selectedCompetition.id)}
                            disabled={loadingVoting}
                            title="UNIFIED APPROACH: Tally Votes & Advance to Round 2"
                          >
                            {loadingVoting ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Tallying...
                              </>
                            ) : (
                              <>
                                <FaVoteYea className="me-2" />
                                Tally Votes & Advance
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline-info"
                            onClick={() => {
                              loadVotingStats(selectedCompetition.id);
                              loadNonVoters(selectedCompetition.id);
                            }}
                            disabled={loadingVoting}
                          >
                            Refresh Stats
                          </Button>
                        </div>
                        <div className="mt-3">
                          <small className="text-muted">
                            <strong>UNIFIED SYSTEM:</strong> Automatically processes both traditional rankings and judgment-based scores.<br/>
                            Judgment criteria are converted to 1st/2nd/3rd place votes. Winner determined by most 1st place rankings.
                          </small>
                        </div>
                      </>
                    )}
                  </>
                )}

                {(selectedCompetition.status === "VotingRound1Tallying" || selectedCompetition.status === "VotingRound2Open") && (
                  <Alert variant="info">
                    <strong>Advanced Stage:</strong> Competition has progressed beyond Round 1 voting.
                  </Alert>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowVotingModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  function renderCompetitionsTable() {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (!competitions || competitions.length === 0) {
      return (
        <Alert variant="info">
          No competitions found.{" "}
          {activeTab === "drafts"
            ? "Create a new competition to get started."
            : ""}
        </Alert>
      );
    }

    return (
      <>
        <Table responsive bordered hover variant="dark" className="text-light">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Deadline</th>
              <th>Prize</th>
              <th>Submissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((competition) => (
              <tr key={competition.id} data-competition-id={competition.id}>
                <td>{competition.title}</td>
                <td>
                  <Badge bg={getStatusBadgeColor(competition.status)}>
                    {getStatusDisplayText(competition.status)}
                  </Badge>
                </td>
                <td>{new Date(competition.startDate).toLocaleDateString()}</td>
                <td>{new Date(competition.endDate).toLocaleDateString()}</td>
                <td>{competition.prizes}</td>
                <td>{competition.numberOfSubmissions || 0}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditCompetition(competition)}
                      title="Edit"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="outline-info"
                      size="sm"
                      as={Link}
                      to={`/competitions/${competition.id}`}
                      target="_blank"
                      title="View"
                    >
                      <FaEye />
                    </Button>
                    {competition.status === "Upcoming" && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(
                            competition.id,
                            "OpenForSubmissions"
                          )
                        }
                        title="Open for Submissions"
                      >
                        <FaPlayCircle />
                      </Button>
                    )}
                    {competition.status === "OpenForSubmissions" && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleSetupVoting(competition)}
                        title="Setup Voting"
                        disabled={loadingVoting}
                      >
                        <FaCogs />
                      </Button>
                    )}
                    {(competition.status === "VotingRound1Setup" || competition.status === "VotingRound1Open") && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleSetupVoting(competition)}
                        title="Manage Voting"
                        disabled={loadingVoting}
                      >
                        <FaUsers />
                      </Button>
                    )}
                    {competition.status === "VotingRound1Open" && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleTallyVotes(competition.id)}
                        title="UNIFIED APPROACH: Tally Votes & Advance to Round 2"
                        disabled={loadingVoting}
                      >
                        <FaVoteYea />
                      </Button>
                    )}
                    {competition.status === "VotingRound2Tallying" && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleTallyRound2Votes(competition.id)}
                        title="Tally Round 2 Votes & Determine Winner"
                        disabled={loadingVoting}
                      >
                        <FaTrophy />
                      </Button>
                    )}
                    {competition.status === "VotingRound1Tallying" && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(competition.id, "Completed")
                        }
                        title="Mark as Completed"
                      >
                        <FaStopCircle />
                      </Button>
                    )}
                    {(competition.status === "Closed" || competition.status === "Completed") && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={Link}
                        to={`/competitions/${competition.id}/results`}
                        target="_blank"
                        title="View Results"
                      >
                        <FaChartBar />
                      </Button>
                    )}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteCompetition(competition.id)}
                      title="Delete Competition"
                      disabled={submitting}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination className="pagination-dark">
              <Pagination.First
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
              {paginationItems}
              <Pagination.Next
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </>
    );
  }
};

export default AdminCompetitionsPage;
