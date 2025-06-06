import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Card,
  Button,
  Alert,
  Container,
  Row,
  Col,
  Table,
  Badge,
} from "react-bootstrap";
import { FaCheckCircle, FaDownload } from "react-icons/fa";
import { fetchOrderDetails } from "../../store/adminSlice";
import {
  fetchProductDownloadUrl,
  clearDownloadUrl,
} from "../../store/productSlice";

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orderDetail, loading, error } = useSelector((state) => state.admin);
  const { downloadUrl } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/order-confirmation/${id}` } });
      return;
    }

    // Fetch order details
    if (id) {
      dispatch(fetchOrderDetails(id));
    }

    // Clean up downloadUrl on unmount
    return () => {
      dispatch(clearDownloadUrl());
    };
  }, [id, isAuthenticated, navigate, dispatch]);

  const handleDownload = (productId) => {
    dispatch(fetchProductDownloadUrl(productId));
  };

  // If loading or error, show appropriate message
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <h1>Loading order details...</h1>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-4">
          <Button as={Link} to="/" variant="primary">
            Return to Home
          </Button>
        </div>
      </Container>
    );
  }

  if (!orderDetail) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          Order not found. It may have been deleted or you may not have
          permission to view it.
        </Alert>
        <div className="text-center mt-4">
          <Button as={Link} to="/" variant="primary">
            Return to Home
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <FaCheckCircle className="text-success mb-3" size={64} />
        <h1>Order Confirmed!</h1>
        <p className="lead">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      {downloadUrl && (
        <Alert variant="success" className="mb-4">
          Your download is ready!{" "}
          <a href={downloadUrl} className="alert-link" download>
            Click here
          </a>{" "}
          to download.
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Order Details</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Order Information</h6>
                  <p className="mb-1">
                    <strong>Order ID:</strong> #{orderDetail.id}
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong>{" "}
                    {new Date(orderDetail.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mb-0">
                    <strong>Status:</strong>{" "}
                    <Badge
                      bg={
                        orderDetail.status === "Completed"
                          ? "success"
                          : orderDetail.status === "Processing"
                          ? "warning"
                          : "primary"
                      }
                    >
                      {orderDetail.status}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Shipping Address</h6>
                  <p className="mb-1">
                    {orderDetail.shippingAddress.firstName}{" "}
                    {orderDetail.shippingAddress.lastName}
                  </p>
                  <p className="mb-1">{orderDetail.shippingAddress.address}</p>
                  <p className="mb-1">
                    {orderDetail.shippingAddress.city},{" "}
                    {orderDetail.shippingAddress.state}{" "}
                    {orderDetail.shippingAddress.zipCode}
                  </p>
                  <p className="mb-0">{orderDetail.shippingAddress.country}</p>
                </Col>
              </Row>

              <h6>Items</h6>
              <Table responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetail.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.product.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                              }}
                              className="me-2 rounded"
                            />
                          )}
                          <div>
                            <Link
                              to={`/products/${item.product.id}`}
                              className="text-decoration-none"
                            >
                              {item.product.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                      <td>
                        {item.product.isDigital && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleDownload(item.product.id)}
                          >
                            <FaDownload className="me-1" /> Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Payment Information</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <strong>Payment Method:</strong> {orderDetail.paymentMethod}
              </p>
              {orderDetail.paymentMethod === "creditCard" && (
                <p className="mb-0">
                  <strong>Card:</strong> **** **** ****{" "}
                  {orderDetail.lastFourDigits || "1234"}
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${orderDetail.subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Taxes</span>
                <span>${orderDetail.taxAmount.toFixed(2)}</span>
              </div>
              {orderDetail.discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Discount</span>
                  <span>-${orderDetail.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <strong>Total</strong>
                <strong>${orderDetail.total.toFixed(2)}</strong>
              </div>

              <div className="d-grid gap-2">
                <Button variant="primary" as={Link} to="/products">
                  Continue Shopping
                </Button>
                <Button variant="outline-secondary" as={Link} to="/orders">
                  View All Orders
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div className="mt-4">
            <Card className="border-0 bg-light">
              <Card.Body>
                <h6>Need Help?</h6>
                <p className="small mb-2">
                  If you have any questions about your order, please contact our
                  customer support.
                </p>
                <Link to="/contact" className="btn btn-link p-0">
                  Contact Support
                </Link>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderConfirmationPage;
