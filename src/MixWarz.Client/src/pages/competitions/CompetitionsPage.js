import React, { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Pagination,
  Container,
  Badge,
  Spinner,
  Alert,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCompetitions,
  setPage,
  setPageSize,
} from "../../store/competitionSlice";
import { FaClock, FaUsers, FaFilter, FaSearch, FaTrophy } from "react-icons/fa";
import { getStatusDisplayText, getStatusStyling } from "../../utils/competitionUtils";

const DEFAULT_COMPETITION_IMAGE = "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const CompetitionsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { competitions, loading, error, totalCount, pageSize, currentPage } =
    useSelector((state) => state.competitions);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState({
    status: "",
    genre: "",
    searchTerm: "",
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Image error handling state
  const [failedImages, setFailedImages] = useState(new Set());

  // Memoize loadCompetitions to prevent recreation on each render
  const loadCompetitions = useCallback(() => {
    const params = {
      page: currentPage,
      pageSize,
    };

    // Map frontend filter values to backend enum values
    if (filters.status && filters.status !== "") {
      // Map frontend status values to backend enum values
      const statusMapping = {
        "Active": "OpenForSubmissions", // Map "Active" to "OpenForSubmissions"
        "Upcoming": "Upcoming",
        "Completed": "Completed"
      };
      params.status = statusMapping[filters.status] || filters.status;
    }

    if (filters.genre && filters.genre !== "") {
      // Genre values should match the backend enum (they already do)
      params.genre = filters.genre;
    }

    if (filters.searchTerm && filters.searchTerm !== "") {
      params.searchTerm = filters.searchTerm;
    }

    console.log("Loading competitions with params:", params);
    dispatch(fetchCompetitions(params));
  }, [dispatch, currentPage, pageSize, filters]);

  // Load competitions when relevant state changes
  useEffect(() => {
    console.log("Loading competitions due to dependency changes");
    loadCompetitions();
  }, [loadCompetitions]);

  // Debug log when competitions update
  useEffect(() => {
    console.log("Competitions updated:", competitions);
    if (competitions && Array.isArray(competitions)) {
      console.log("Competitions array length:", competitions.length);
      if (competitions.length > 0) {
        console.log("First competition sample:", competitions[0]);
      }
    }
  }, [competitions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Auto-apply filters when they change (except for search term)
    if (name !== 'searchTerm') {
      // Small delay to ensure state is updated
      setTimeout(() => {
        dispatch(setPage(1));
      }, 10);
    }
  };

  const handleApplyFilters = (e) => {
    if (e) {
      e.preventDefault();
    }
    console.log("Applying filters:", filters);
    dispatch(setPage(1));
    loadCompetitions();
  };

  const handleResetFilters = (e) => {
    if (e) {
      e.preventDefault();
    }
    console.log("Resetting filters");
    setFilters({
      status: "",
      genre: "",
      searchTerm: "",
    });
    dispatch(setPage(1));
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleImageError = (competitionId) => {
    setFailedImages(prev => new Set([...prev, competitionId]));
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

  if (loading && competitions.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading competitions...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1
            className="display-5 fw-bold mb-0"
            style={{ color: "var(--accent-primary)" }}
          >
            Active Competitions
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Join the mix wars and prove your skills
          </p>
        </div>
        <div className="text-end">
          <FaTrophy
            size={48}
            style={{ color: "var(--accent-primary)", opacity: 0.7 }}
          />
        </div>
      </div>

      {/* Membership Notice for Non-Authenticated Users */}
      {!isAuthenticated && (
        <Alert 
          variant="info" 
          className="mb-4"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--accent-primary)",
            color: "var(--text-primary)"
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>🎵 Ready to compete?</strong> Browse competitions for free, but you'll need a paid membership to participate in battles and submit your mixes.
            </div>
            <div>
              <Button
                as={Link}
                to="/pricing"
                variant="primary"
                size="sm"
                className="ms-3"
              >
                View Membership Plans
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <Row className="mb-4">
        <Col md={3}>
          <Form onSubmit={handleApplyFilters}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search competitions..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
                name="searchTerm"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              />
              <Button type="submit" variant="outline-primary">
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.status}
            onChange={handleFilterChange}
            name="status"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.genre}
            onChange={handleFilterChange}
            name="genre"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Genres</option>
            <option value="Pop">Pop</option>
            <option value="Rock">Rock</option>
            <option value="HipHop">Hip Hop</option>
            <option value="Jazz">Jazz</option>
            <option value="Classical">Classical</option>
            <option value="Electronic">Electronic</option>
            <option value="Country">Country</option>
            <option value="RnB">R&B</option>
            <option value="Reggae">Reggae</option>
            <option value="Blues">Blues</option>
            <option value="Metal">Metal</option>
            <option value="Folk">Folk</option>
            <option value="World">World</option>
            <option value="Other">Other</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={handleApplyFilters}
              className="flex-fill"
            >
              <FaFilter className="me-1" />
              Apply Filters
            </Button>
            <Button 
              variant="outline-danger" 
              onClick={handleResetFilters}
              className="flex-fill"
            >
              Reset
            </Button>
          </div>
        </Col>
      </Row>

      {/* Competitions Grid */}
      {!competitions ||
      !Array.isArray(competitions) ||
      competitions.length === 0 ? (
        <Col>
          <div className="text-center py-5 rounded-xl bg-secondary bg-opacity-10">
            <h4 style={{ color: "var(--text-primary)" }}>
              No competitions found
            </h4>
            <p style={{ color: "var(--text-secondary)" }}>
              Try adjusting your search criteria or check back later
            </p>
          </div>
        </Col>
      ) : (
        <>
          <Row>
            {competitions.map((competition, index) => {
              if (!competition) return null;

              // Extract competition properties with fallbacks
              const competitionId =
                competition.id ||
                competition.competitionId ||
                `unknown-${index}`;
              const competitionTitle =
                competition.title || "Unnamed Competition";
              
              // Determine the image URL to use
              const hasSpecificImage = competition.imageUrl || competition.coverImageUrl;
              const imageHasFailed = failedImages.has(competitionId);
              
              const competitionImageUrl = (hasSpecificImage && !imageHasFailed) 
                ? (competition.imageUrl || competition.coverImageUrl)
                : DEFAULT_COMPETITION_IMAGE;

              const competitionGenre = competition.genre || "Electronic";
              const competitionStatus = competition.status || "Unknown";
              const startDate = competition.startDate
                ? new Date(competition.startDate).toLocaleDateString()
                : "N/A";
              const endDate = competition.endDate
                ? new Date(competition.endDate).toLocaleDateString()
                : "N/A";
              const submissionsCount = competition.submissionsCount || "0";

              return (
                <Col md={4} key={competitionId} className="mb-4">
                  <Card className="h-100 card-hover border-0">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={competitionImageUrl}
                        alt={competitionTitle}
                        className="product-image"
                        onError={() => {
                          // Only handle error for competition-specific images
                          if (hasSpecificImage && !imageHasFailed) {
                            handleImageError(competitionId);
                          }
                        }}
                      />
                      {/* Add an overlay with gradient for better text contrast */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
                        }}
                      ></div>
                      <div className="position-absolute bottom-0 start-0 p-3 w-100">
                        <Badge
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--accent-primary)",
                            border: "1px solid var(--accent-primary)",
                          }}
                          className="me-2 px-2 py-1"
                        >
                          {competitionGenre}
                        </Badge>
                        <Badge
                          style={getStatusStyling(competitionStatus)}
                          className="px-2 py-1"
                        >
                          {getStatusDisplayText(competitionStatus)}
                        </Badge>
                      </div>
                    </div>
                    <Card.Body>
                      <Card.Title
                        className="mb-3"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {competitionTitle}
                      </Card.Title>
                      <div className="d-flex align-items-center mb-3 small">
                        <div className="me-3 d-flex align-items-center">
                          <FaClock
                            className="me-1"
                            style={{ color: "var(--accent-primary)" }}
                          />
                          <span style={{ color: "var(--text-secondary)" }}>
                            {getStatusDisplayText(competitionStatus) === "Upcoming"
                              ? `Starts: ${startDate}`
                              : `Ends: ${endDate}`}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <FaUsers
                            className="me-1"
                            style={{ color: "var(--accent-primary)" }}
                          />
                          <span style={{ color: "var(--text-secondary)" }}>
                            {submissionsCount} Entries
                          </span>
                        </div>
                      </div>
                      <div className="d-grid">
                        <Button
                          as={Link}
                          to={`/competitions/${competitionId}`}
                          variant="outline-primary"
                          className="w-100"
                        >
                          View Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                {paginationItems}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default CompetitionsPage;
