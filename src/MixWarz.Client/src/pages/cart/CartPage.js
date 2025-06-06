import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Card, Row, Col, Form, Alert } from "react-bootstrap";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../../store/cartSlice";
import { BsTrash } from "react-icons/bs";

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Calculate subtotal, taxes, and total
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const taxRate = 0.08; // 8% tax rate
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id, quantity }));
    } else {
      dispatch(removeFromCart(id));
    }
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      navigate("/login", {
        state: {
          from: "/cart",
          message: "Please login to continue with checkout.",
        },
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <h1 className="mb-4">Your Cart</h1>
        <Alert variant="info">
          Your cart is empty. Browse our <Link to="/products">products</Link> to
          add items to your cart.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4">Your Cart</h1>

      <Row>
        <Col lg={8}>
          <Card
            className="mb-4"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <Card.Body>
              <Table responsive variant="dark">
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
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                              }}
                              className="me-3 rounded"
                            />
                          )}
                          <div>
                            <Link
                              to={`/products/${item.id}`}
                              className="text-decoration-none"
                              style={{ color: "var(--accent-primary)" }}
                            >
                              <strong>{item.name}</strong>
                            </Link>
                            {item.category && (
                              <p className="text-muted small mb-0">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td style={{ width: "150px" }}>
                        <div className="d-flex align-items-center">
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-color)",
                              color: "var(--text-primary)",
                            }}
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            -
                          </Button>
                          <Form.Control
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            min="1"
                            className="mx-2 text-center"
                            style={{
                              width: "60px",
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-color)",
                              color: "var(--text-primary)",
                            }}
                          />
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-color)",
                              color: "var(--text-primary)",
                            }}
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td>
                        <strong>
                          ${(item.price * item.quantity).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="text-danger"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <BsTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer
              className="d-flex justify-content-between"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <Button
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                className="d-flex align-items-center"
                as={Link}
                to="/products"
              >
                Continue Shopping
              </Button>
              <Button
                variant="outline-danger"
                className="d-flex align-items-center"
                onClick={handleClearCart}
              >
                Clear Cart
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={4}>
          <Card
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
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span style={{ color: "var(--text-primary)" }}>Subtotal</span>
                <span style={{ color: "var(--text-primary)" }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span style={{ color: "var(--text-primary)" }}>Taxes (8%)</span>
                <span style={{ color: "var(--text-primary)" }}>
                  ${taxes.toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-4">
                <strong style={{ color: "var(--accent-primary)" }}>
                  Total
                </strong>
                <strong style={{ color: "var(--accent-primary)" }}>
                  ${total.toFixed(2)}
                </strong>
              </div>

              <div className="d-grid gap-2">
                <Button
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    borderColor: "var(--accent-primary)",
                    color: "#000",
                  }}
                  size="lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>

              <div className="mt-3">
                <p className="text-muted small mb-0">
                  By proceeding to checkout, you agree to our{" "}
                  <Link to="/terms" style={{ color: "var(--accent-primary)" }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CartPage;
