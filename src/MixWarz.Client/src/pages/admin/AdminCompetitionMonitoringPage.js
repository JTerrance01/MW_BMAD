import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Spinner,
  Alert,
  Badge,
  Form,
  InputGroup,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  getCompetitionMonitoring,
  getCompetitionVotingProgress,
} from "../../store/adminSlice";
import CompetitionMonitoringPanel from "../../components/admin/CompetitionMonitoringPanel";
import { FaFilter, FaSync, FaList, FaTable } from "react-icons/fa";

const AdminCompetitionMonitoringPage = () => {
  const dispatch = useDispatch();

  // Get state from Redux store
  const {
    competitionMonitoring,
    competitionMonitoringLoading,
    competitionMonitoringError,
  } = useSelector((state) => state.admin);

  // Local state
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [filter, setFilter] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"

  // Fetch competitions when the component mounts
  useEffect(() => {
    dispatch(getCompetitionMonitoring());
  }, [dispatch]);

  // Handle competition selection
  const handleSelectCompetition = (competition) => {
    setSelectedCompetition(competition);
  };

  // Handle refreshing the competition list
  const handleRefreshCompetitions = () => {
    dispatch(getCompetitionMonitoring());
  };

  // Handle refreshing a specific competition
  const handleRefreshSelectedCompetition = () => {
    if (selectedCompetition) {
      // Get the updated competition data from the API
      dispatch(getCompetitionMonitoring()).then(() => {
        // Find the updated competition in the new list
        const updatedCompetition = competitionMonitoring.find(
          (c) => c.id === selectedCompetition.id
        );
        if (updatedCompetition) {
          setSelectedCompetition(updatedCompetition);
        }
      });
    }
  };

  // Filter competitions based on search input
  const filteredCompetitions =
    competitionMonitoring?.filter(
      (competition) =>
        competition.title.toLowerCase().includes(filter.toLowerCase()) ||
        competition.status.toLowerCase().includes(filter.toLowerCase())
    ) || [];

  // Get badge color for competition status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "OpenForSubmission":
        return "primary";
      case "VotingRound1Setup":
      case "VotingRound2Setup":
        return "info";
      case "VotingRound1Open":
      case "VotingRound2Open":
        return "warning";
      case "VotingRound1Tallying":
      case "VotingRound2Tallying":
        return "secondary";
      case "RequiresManualWinnerSelection":
        return "danger";
      case "Completed":
        return "success";
      case "Archived":
        return "dark";
      default:
        return "primary";
    }
  };

  // Get human-readable status name
  const getStatusDisplayName = (status) => {
    const displayMap = {
      OpenForSubmission: "Open for Submissions",
      VotingRound1Setup: "Round 1 Setup",
      VotingRound1Open: "Round 1 Voting",
      VotingRound1Tallying: "Round 1 Tallying",
      VotingRound2Setup: "Round 2 Setup",
      VotingRound2Open: "Round 2 Voting",
      VotingRound2Tallying: "Round 2 Tallying",
      RequiresManualWinnerSelection: "Needs Tie Resolution",
      Completed: "Completed",
      Archived: "Archived",
    };

    return displayMap[status] || "Unknown Status";
  };

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Competition Monitoring</h1>

      {competitionMonitoringError && (
        <Alert variant="danger" className="mb-4">
          Error loading competitions: {competitionMonitoringError}
        </Alert>
      )}

      <Row>
        <Col lg={selectedCompetition ? 4 : 12} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Active Competitions</h5>
              <div>
                <Button
                  variant="light"
                  size="sm"
                  className="me-2"
                  onClick={handleRefreshCompetitions}
                  disabled={competitionMonitoringLoading}
                >
                  <FaSync
                    className={competitionMonitoringLoading ? "spin" : ""}
                  />
                </Button>
                <ButtonGroup className="ms-2">
                  <Button
                    variant={viewMode === "table" ? "light" : "outline-light"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <FaTable />
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "light" : "outline-light"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                  >
                    <FaList />
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="p-3">
                <InputGroup>
                  <Form.Control
                    placeholder="Search competitions..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <Button variant="outline-secondary">
                    <FaFilter />
                  </Button>
                </InputGroup>
              </div>

              {competitionMonitoringLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-3">Loading competitions...</p>
                </div>
              ) : filteredCompetitions.length === 0 ? (
                <div className="text-center py-5">
                  <p className="mb-0">
                    No competitions found{filter ? ` matching "${filter}"` : ""}
                    .
                  </p>
                </div>
              ) : viewMode === "table" ? (
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Submissions</th>
                      <th>Deadline</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompetitions.map((competition) => (
                      <tr
                        key={competition.id}
                        className={
                          selectedCompetition?.id === competition.id
                            ? "table-primary"
                            : ""
                        }
                      >
                        <td>{competition.title}</td>
                        <td>
                          <Badge bg={getStatusBadgeColor(competition.status)}>
                            {getStatusDisplayName(competition.status)}
                          </Badge>
                        </td>
                        <td>{competition.submissionCount || 0}</td>
                        <td>
                          {new Date(competition.deadline).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleSelectCompetition(competition)}
                          >
                            Monitor
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="p-3">
                  <Row xs={1} md={2} className="g-3">
                    {filteredCompetitions.map((competition) => (
                      <Col key={competition.id}>
                        <Card
                          className={`h-100 ${
                            selectedCompetition?.id === competition.id
                              ? "border-primary"
                              : ""
                          }`}
                          onClick={() => handleSelectCompetition(competition)}
                          style={{ cursor: "pointer" }}
                        >
                          <Card.Body>
                            <Card.Title>{competition.title}</Card.Title>
                            <Badge
                              bg={getStatusBadgeColor(competition.status)}
                              className="mb-2"
                            >
                              {getStatusDisplayName(competition.status)}
                            </Badge>
                            <Card.Text className="mb-1">
                              <small className="text-muted">
                                Submissions: {competition.submissionCount || 0}
                              </small>
                            </Card.Text>
                            <Card.Text>
                              <small className="text-muted">
                                Deadline:{" "}
                                {new Date(
                                  competition.deadline
                                ).toLocaleDateString()}
                              </small>
                            </Card.Text>
                          </Card.Body>
                          <Card.Footer className="bg-white">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="w-100"
                            >
                              Monitor
                            </Button>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {selectedCompetition && (
          <Col lg={8}>
            <CompetitionMonitoringPanel
              competition={selectedCompetition}
              onRefreshCompetition={handleRefreshSelectedCompetition}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
};

// Button group component
const ButtonGroup = ({ children, className }) => {
  return <div className={`btn-group ${className || ""}`}>{children}</div>;
};

export default AdminCompetitionMonitoringPage;
