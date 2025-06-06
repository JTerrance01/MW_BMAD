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
  Row,
  Col,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  fetchAdminOrders,
  setPage,
  fetchOrderDetails,
  updateOrderStatus,
} from "../../store/adminSlice";
import { FaSearch, FaEye, FaDownload } from "react-icons/fa";
import "./AdminStyles.css";

const AdminOrdersPage = () => {
  const dispatch = useDispatch();
  const {
    orders,
    orderDetail,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
  } = useSelector((state) => state.admin);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState("");

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    loadOrders();
  }, [dispatch, currentPage, pageSize, filterStatus, activeTab]);

  // Add debugging for orderDetail when it changes
  useEffect(() => {
    if (orderDetail) {
      console.log("Current order detail:", orderDetail);
      console.log("Order ID:", orderDetail.id || orderDetail.orderId);
      console.log("Order Status:", orderDetail.status);
    }
  }, [orderDetail]);

  const loadOrders = () => {
    // Prepare filter params
    const params = {
      page: currentPage,
      pageSize,
      searchTerm: searchTerm || undefined,
      status: filterStatus || undefined,
      orderDateFrom: dateRange.startDate
        ? new Date(dateRange.startDate + "T00:00:00Z").toISOString()
        : undefined,
      orderDateTo: dateRange.endDate
        ? new Date(dateRange.endDate + "T23:59:59Z").toISOString()
        : undefined,
    };

    // Add status filter based on active tab
    if (activeTab === "pending") {
      params.status = "PendingPayment";
    } else if (activeTab === "processing") {
      params.status = "Paid";
    } else if (activeTab === "completed") {
      params.status = "Fulfilled";
    } else if (activeTab === "cancelled") {
      params.status = "Cancelled";
    } else if (activeTab === "failed") {
      params.status = "Failed";
    }

    console.log("Fetching orders with params:", params);
    dispatch(fetchAdminOrders(params))
      .unwrap()
      .then((data) => {
        console.log("Orders loaded successfully:", data);
      })
      .catch((err) => {
        console.error("Error loading orders:", err);
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setPage(1)); // Reset to first page on new search
    loadOrders();
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(setPage(1)); // Reset to first page on tab change
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleViewDetail = (orderId) => {
    setSelectedOrderId(orderId);
    console.log(`Fetching details for order ID: ${orderId}`);
    dispatch(fetchOrderDetails(orderId))
      .unwrap()
      .then((data) => {
        console.log("Order detail data received:", data);
        setShowDetailModal(true);
      })
      .catch((error) => {
        console.error("Error fetching order details:", error);
        alert(`Failed to fetch order details: ${error}`);
      });
  };

  const handleShowUpdateStatusModal = () => {
    if (orderDetail) {
      setNewOrderStatus(orderDetail.status);
      setShowUpdateStatusModal(true);
    }
  };

  const handleUpdateStatus = () => {
    if (!orderDetail) {
      alert("Order details not found");
      return;
    }

    if (!newOrderStatus) {
      alert("Please select a valid status");
      return;
    }

    // Determine the correct orderId - backend might use orderId instead of id
    const orderId = orderDetail.id || orderDetail.orderId;

    if (!orderId) {
      console.error("Order ID not found in order details", orderDetail);
      alert("Error: Order ID not found");
      return;
    }

    console.log(`Updating order ${orderId} status to ${newOrderStatus}`);

    dispatch(
      updateOrderStatus({
        orderId: parseInt(orderId, 10),
        newStatus: newOrderStatus,
      })
    )
      .unwrap()
      .then((result) => {
        console.log("Order status update successful:", result);
        setShowUpdateStatusModal(false);
        // Refresh order details to reflect changes
        dispatch(fetchOrderDetails(orderId));
        // Refresh orders list
        loadOrders();
      })
      .catch((error) => {
        console.error("Failed to update order status:", error);
        alert(`Failed to update order status: ${error}`);
      });
  };

  // Generate pagination items
  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <Pagination.Item
        key={`page-${i}`}
        active={i === currentPage}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </Pagination.Item>
    );
  }

  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "PendingPayment":
        return "warning";
      case "Paid":
        return "info";
      case "Fulfilled":
        return "success";
      case "Cancelled":
        return "danger";
      case "Failed":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div className="admin-page">
      <h1 className="mb-4">Order Management</h1>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="bg-dark mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
            <Form
              onSubmit={handleSearch}
              className="d-flex"
              style={{ width: "300px" }}
            >
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search by Order ID or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark"
                />
                <Button type="submit" variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            <div className="d-flex my-3 my-md-0">
              <Form.Group className="me-2" style={{ width: "150px" }}>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  placeholder="Start Date"
                  className="bg-dark"
                />
              </Form.Group>
              <Form.Group style={{ width: "150px" }}>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  placeholder="End Date"
                  className="bg-dark"
                />
              </Form.Group>
              <Button
                variant="outline-secondary"
                className="ms-2"
                onClick={loadOrders}
              >
                Filter
              </Button>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4 product-tabs"
          >
            <Tab eventKey="all" title="All Orders">
              {renderOrdersTable()}
            </Tab>
            <Tab eventKey="pending" title="Pending Payment">
              {renderOrdersTable()}
            </Tab>
            <Tab eventKey="processing" title="Paid">
              {renderOrdersTable()}
            </Tab>
            <Tab eventKey="completed" title="Fulfilled">
              {renderOrdersTable()}
            </Tab>
            <Tab eventKey="cancelled" title="Cancelled">
              {renderOrdersTable()}
            </Tab>
            <Tab eventKey="failed" title="Failed">
              {renderOrdersTable()}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-dark text-light">
          <Modal.Title>Order Detail</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : orderDetail ? (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Order Information</h5>
                  <p className="mb-1">
                    <strong>Order ID:</strong> #
                    {orderDetail.id || orderDetail.orderId}
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong>{" "}
                    {new Date(
                      orderDetail.createdAt || orderDetail.orderDate
                    ).toLocaleDateString()}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong>{" "}
                    <Badge bg={getStatusBadgeColor(orderDetail.status)}>
                      {orderDetail.status}
                    </Badge>
                  </p>
                  <p className="mb-1">
                    <strong>Total:</strong> $
                    {(
                      orderDetail.total ||
                      orderDetail.totalAmount ||
                      0
                    ).toFixed(2)}
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Customer Information</h5>
                  <p className="mb-1">
                    <strong>Name:</strong>{" "}
                    {orderDetail.customerName ||
                      orderDetail.username ||
                      "Not available"}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong>{" "}
                    {orderDetail.customerEmail ||
                      orderDetail.email ||
                      "Not available"}
                  </p>
                  <p className="mb-1">
                    <strong>User ID:</strong> {orderDetail.userId}
                  </p>
                </Col>
              </Row>
              <h5>Shipping Address</h5>
              <Row className="mb-4">
                <Col md={12}>
                  {orderDetail.shippingAddress ? (
                    <>
                      <p className="mb-1">
                        {orderDetail.shippingAddress?.firstName || ""}{" "}
                        {orderDetail.shippingAddress?.lastName || ""}
                      </p>
                      <p className="mb-1">
                        {orderDetail.shippingAddress?.address || ""}
                      </p>
                      <p className="mb-1">
                        {orderDetail.shippingAddress?.city || ""},{" "}
                        {orderDetail.shippingAddress?.state || ""}{" "}
                        {orderDetail.shippingAddress?.zipCode || ""}
                      </p>
                      <p className="mb-0">
                        {orderDetail.shippingAddress?.country || ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">No shipping address available</p>
                  )}
                </Col>
              </Row>
              <h5>Order Items</h5>
              <Table responsive bordered variant="dark">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(orderDetail.items || orderDetail.orderItems || []).map(
                    (item) => (
                      <tr key={`item-${item.id || item.orderItemId}`}>
                        <td>
                          {item.productName ||
                            item.product?.name ||
                            "Unknown Product"}
                        </td>
                        <td>
                          $
                          {(item.price || item.priceAtPurchase || 0).toFixed(2)}
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          $
                          {(
                            (item.price || item.priceAtPurchase || 0) *
                            item.quantity
                          ).toFixed(2)}
                        </td>
                        <td>
                          {item.isDigital ||
                          (item.product && item.product.isDigital) ? (
                            <Badge bg="info">Digital</Badge>
                          ) : (
                            <Badge bg="secondary">Physical</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end">
                      <strong>Subtotal:</strong>
                    </td>
                    <td colSpan="2">
                      $
                      {(
                        orderDetail.subtotal ||
                        orderDetail.totalAmount -
                          (orderDetail.taxAmount || 0) ||
                        0
                      ).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end">
                      <strong>Tax:</strong>
                    </td>
                    <td colSpan="2">
                      ${(orderDetail.taxAmount || 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="text-end">
                      <strong>Total:</strong>
                    </td>
                    <td colSpan="2">
                      $
                      {(
                        orderDetail.total ||
                        orderDetail.totalAmount ||
                        0
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
              <h5>Payment Information</h5>
              <Row>
                <Col md={12}>
                  <p className="mb-1">
                    <strong>Payment Method:</strong>{" "}
                    {orderDetail.paymentMethod ||
                    orderDetail.stripePaymentIntentId
                      ? "Credit Card"
                      : "Unknown"}
                  </p>
                  {(orderDetail.paymentMethod === "creditCard" ||
                    orderDetail.stripePaymentIntentId) && (
                    <p className="mb-0">
                      <strong>Payment ID:</strong>{" "}
                      {orderDetail.stripePaymentIntentId
                        ? orderDetail.stripePaymentIntentId.substring(0, 8) +
                          "..."
                        : "**** **** **** " +
                          (orderDetail.lastFourDigits || "1234")}
                    </p>
                  )}
                </Col>
              </Row>
            </>
          ) : (
            <Alert variant="info">Order not found.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark text-light">
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          {orderDetail && (
            <Button variant="primary" onClick={handleShowUpdateStatusModal}>
              Update Status
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Order Status Update Modal */}
      <Modal
        show={showUpdateStatusModal}
        onHide={() => setShowUpdateStatusModal(false)}
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-dark text-light">
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-light">
          <Form>
            <Form.Group>
              <Form.Label>New Status</Form.Label>
              <Form.Select
                value={newOrderStatus}
                onChange={(e) => setNewOrderStatus(e.target.value)}
                className="bg-dark"
              >
                <option value="">Select new status</option>
                <option value="PendingPayment">Pending Payment</option>
                <option value="Paid">Paid</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Failed">Failed</option>
              </Form.Select>
              <small className="text-muted d-block mt-2">
                Current status: {orderDetail?.status || "Unknown"}
              </small>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="bg-dark text-light">
          <Button
            variant="secondary"
            onClick={() => setShowUpdateStatusModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  function renderOrdersTable() {
    // Initialize orders as an empty array if it's undefined
    const safeOrders = orders || [];

    if (loading && safeOrders.length === 0) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (!safeOrders || safeOrders.length === 0) {
      return (
        <Alert variant="info">
          No orders found matching the current filters.
        </Alert>
      );
    }

    return (
      <>
        <Table responsive bordered hover variant="dark" className="table-dark">
          <thead className="bg-dark">
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Items</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeOrders.map((order) => (
              <tr key={`order-${order.id || order.orderId}`}>
                <td>#{order.id || order.orderId}</td>
                <td>
                  <div>
                    {order.customerName || order.username || "Unknown"}
                    <br />
                    <small className="text-muted">
                      {order.customerEmail || order.email || "No email"}
                    </small>
                  </div>
                </td>
                <td>
                  {new Date(
                    order.createdAt || order.orderDate
                  ).toLocaleDateString()}
                </td>
                <td>
                  <Badge bg={getStatusBadgeColor(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td>{order.itemCount || order.orderItems?.length || 0}</td>
                <td>${(order.total || order.totalAmount || 0).toFixed(2)}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleViewDetail(order.id || order.orderId)}
                  >
                    <FaEye className="me-1" /> View
                  </Button>
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

export default AdminOrdersPage;
