import React, { useState, useEffect } from "react";
import { 
  Card, 
  Button, 
  Badge, 
  Row, 
  Col, 
  Spinner, 
  Alert,
  Form,
  Pagination,
  Image
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { 
  FaShoppingBag, 
  FaDownload, 
  FaCalendar, 
  FaFilter,
  FaDollarSign,
  FaMusic
} from "react-icons/fa";
import userService from "../../services/userService";

const UserPurchasesList = ({ isCurrentUser = true }) => {
  // State for purchases data
  const [purchases, setPurchases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Load purchases on component mount
  useEffect(() => {
    loadPurchases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPurchases = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        status: statusFilter || undefined,
        type: typeFilter || undefined
      };

      const response = await userService.getPurchasedProducts(params);
      
      if (response && response.data) {
        setPurchases(response.data.items || response.data || []);
        setTotalCount(response.data.totalCount || response.totalCount || 0);
        setCurrentPage(page);
      } else {
        setPurchases([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Error loading purchases:", err);
      setError("Failed to load your purchases. Please try again.");
      setPurchases([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    loadPurchases(page);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadPurchases(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    loadPurchases(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Completed: { variant: "success", text: "Completed" },
      Pending: { variant: "warning", text: "Pending" },
      Processing: { variant: "info", text: "Processing" },
      Cancelled: { variant: "danger", text: "Cancelled" },
      Refunded: { variant: "secondary", text: "Refunded" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getTypeBadge = (isDigital) => {
    return isDigital ? (
      <Badge bg="info">Digital</Badge>
    ) : (
      <Badge bg="secondary">Physical</Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatPrice = (price) => {
    return `$${(price || 0).toFixed(2)}`;
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  if (loading && purchases.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading your purchases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Purchases</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={() => loadPurchases()}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-5">
        <FaShoppingBag size={48} className="text-muted mb-3" />
        <h5 className="text-muted">No Purchases Found</h5>
        <p className="text-muted">
          {isCurrentUser 
            ? "You haven't made any purchases yet. Browse our products to get started!"
            : "This user hasn't made any purchases yet."
          }
        </p>
        {isCurrentUser && (
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Filters Section */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <h5 className="mb-0 me-3">My Purchases</h5>
          <small className="text-muted">
            Showing {startItem}-{endItem} of {totalCount} purchases
          </small>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter className="me-1" />
          Filters
        </Button>
      </div>

      {/* Filter Form */}
      {showFilters && (
        <Card className="mb-3">
          <Card.Body>
            <Form onSubmit={handleFilterSubmit}>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Refunded">Refunded</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="digital">Digital</option>
                      <option value="physical">Physical</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <div className="d-flex gap-2 w-100">
                    <Button type="submit" variant="primary" size="sm">
                      Apply Filters
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Purchases List */}
      <div className="purchases-list">
        {purchases.map((purchase, index) => (
          <Card key={purchase.id || index} className="mb-3 shadow-sm">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={2} className="text-center">
                  {purchase.product?.imageUrl ? (
                    <Image
                      src={purchase.product.imageUrl}
                      alt={purchase.product.name}
                      rounded
                      style={{ width: "60px", height: "60px", objectFit: "cover" }}
                    />
                  ) : (
                    <div 
                      className="d-flex align-items-center justify-content-center bg-light rounded"
                      style={{ width: "60px", height: "60px" }}
                    >
                      <FaMusic className="text-muted" />
                    </div>
                  )}
                </Col>
                
                <Col md={4}>
                  <h6 className="mb-1">
                    {purchase.product?.name || purchase.productName || "Unknown Product"}
                  </h6>
                  <div className="d-flex gap-2 mb-1">
                    {getStatusBadge(purchase.status)}
                    {getTypeBadge(purchase.isDigital || purchase.product?.isDigital)}
                  </div>
                  <small className="text-muted">
                    <FaCalendar className="me-1" />
                    Purchased: {formatDate(purchase.purchaseDate || purchase.createdAt)}
                  </small>
                </Col>
                
                <Col md={2} className="text-center">
                  <div className="fw-bold text-success">
                    <FaDollarSign className="me-1" />
                    {formatPrice(purchase.price || purchase.priceAtPurchase)}
                  </div>
                  {purchase.quantity && purchase.quantity > 1 && (
                    <small className="text-muted">Qty: {purchase.quantity}</small>
                  )}
                </Col>
                
                <Col md={2} className="text-center">
                  <small className="text-muted">
                    Order #{purchase.orderId || purchase.orderNumber || "N/A"}
                  </small>
                </Col>
                
                <Col md={2} className="text-end">
                  <div className="d-flex flex-column gap-1">
                    {purchase.product?.id && (
                      <Link 
                        to={`/products/${purchase.product.id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        View Product
                      </Link>
                    )}
                    
                    {purchase.isDigital && purchase.status === "Completed" && (
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => {
                          // Handle download logic here
                          console.log("Download product:", purchase);
                        }}
                      >
                        <FaDownload className="me-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First 
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum <= totalPages) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              }
              return null;
            })}
            
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

      {loading && purchases.length > 0 && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" />
          <span className="ms-2">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default UserPurchasesList; 