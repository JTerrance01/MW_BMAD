import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Button,
  Table,
  Pagination,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { format } from "date-fns";
import { getUserActivities } from "../../services/userActivityService";
import "./UserActivityStyles.css";

// Helper function to determine badge color based on activity type
const getBadgeColor = (activityType) => {
  const typeMap = {
    Login: "success",
    Logout: "secondary",
    ProfileUpdate: "info",
    ProfilePictureUpdate: "info",
    BioUpdate: "info",
    CompetitionView: "primary",
    CompetitionSubmission: "warning",
    CompetitionJudging: "danger",
    ProductView: "primary",
    ProductPurchase: "success",
    CartUpdate: "warning",
    OrderPlacement: "warning",
    OrderCompletion: "success",
    BlogArticleView: "primary",
    BlogCommentCreate: "info",
    BlogCommentReply: "info",
    ForumTopicCreate: "info",
    ForumReply: "info",
    PageView: "secondary",
    DownloadResource: "success",
  };

  return typeMap[activityType] || "primary";
};

const UserActivityHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    activityType: "",
    startDate: "",
    endDate: "",
    relatedEntityType: "",
    pageSize: 10,
  });

  const activityTypes = [
    "Login",
    "Logout",
    "ProfileUpdate",
    "ProfilePictureUpdate",
    "BioUpdate",
    "CompetitionView",
    "CompetitionSubmission",
    "CompetitionJudging",
    "ProductView",
    "ProductPurchase",
    "CartUpdate",
    "OrderPlacement",
    "OrderCompletion",
    "BlogArticleView",
    "BlogCommentCreate",
    "BlogCommentReply",
    "ForumTopicCreate",
    "ForumReply",
    "PageView",
    "DownloadResource",
  ];

  const entityTypes = [
    "Competition",
    "Product",
    "Blog",
    "Cart",
    "Order",
    "Profile",
  ];

  // Memoize fetchActivities to prevent it from being recreated on every render
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        pageNumber: currentPage,
        pageSize: filters.pageSize,
        ...(filters.activityType ? { activityType: filters.activityType } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
        ...(filters.relatedEntityType
          ? { relatedEntityType: filters.relatedEntityType }
          : {}),
      };

      const response = await getUserActivities(params);

      setActivities(response.items);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load activities. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]); // Add dependencies here

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]); // Now fetchActivities is stable between renders

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when applying filters
    fetchActivities();
  };

  const handleClearFilters = () => {
    setFilters({
      activityType: "",
      startDate: "",
      endDate: "",
      relatedEntityType: "",
      pageSize: 10,
    });
    setCurrentPage(1);
    fetchActivities();
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageItems = [];

    // Add first and previous buttons
    pageItems.push(
      <Pagination.First
        key="first"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(1)}
      />,
      <Pagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      />
    );

    // Add page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let page = startPage; page <= endPage; page++) {
      pageItems.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    // Add next and last buttons
    pageItems.push(
      <Pagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      />,
      <Pagination.Last
        key="last"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(totalPages)}
      />
    );

    return <Pagination>{pageItems}</Pagination>;
  };

  return (
    <div className="user-activity-history">
      <h3 className="mb-4 fw-semibold">Activity History</h3>

      {/* Filters Card */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-tertiary border-0 fw-medium">
          Filter Activities
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleFilterSubmit}>
            <Row>
              <Col md={4} className="mb-3">
                <Form.Group controlId="activityType">
                  <Form.Label className="fw-medium">Activity Type</Form.Label>
                  <Form.Select
                    name="activityType"
                    value={filters.activityType}
                    onChange={handleFilterChange}
                    className="bg-tertiary text-white border-secondary"
                  >
                    <option value="">All Activity Types</option>
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group controlId="startDate">
                  <Form.Label className="fw-medium">From Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="bg-tertiary text-white border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group controlId="endDate">
                  <Form.Label className="fw-medium">To Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="bg-tertiary text-white border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Group controlId="relatedEntityType">
                  <Form.Label className="fw-medium">Related To</Form.Label>
                  <Form.Select
                    name="relatedEntityType"
                    value={filters.relatedEntityType}
                    onChange={handleFilterChange}
                    className="bg-tertiary text-white border-secondary"
                  >
                    <option value="">All Entity Types</option>
                    {entityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear Filters
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Filtering...
                  </>
                ) : (
                  "Apply Filters"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-tertiary border-0 d-flex justify-content-between align-items-center fw-medium">
          <span>Activity Results</span>
          <Form.Select
            className="ms-auto w-auto bg-tertiary text-white border-secondary"
            name="pageSize"
            value={filters.pageSize}
            onChange={handleFilterChange}
            style={{ maxWidth: "150px" }}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </Form.Select>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3 fw-medium">Loading activities...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : activities.length === 0 ? (
            <div className="text-center py-4">
              <p className="mb-0 fw-medium">
                No activities found matching your filters.
              </p>
            </div>
          ) : (
            <>
              <Table responsive hover variant="dark">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Related To</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <Badge bg={getBadgeColor(activity.activityType)}>
                          {activity.activityTypeDisplay ||
                            activity.activityType}
                        </Badge>
                      </td>
                      <td>{activity.description || "-"}</td>
                      <td>
                        {activity.relatedEntityType ? (
                          <span>
                            {activity.relatedEntityType}{" "}
                            {activity.relatedEntityId
                              ? `#${activity.relatedEntityId}`
                              : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {activity.timeAgo ||
                          new Date(activity.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="d-flex justify-content-center mt-4">
                {renderPagination()}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserActivityHistory;
