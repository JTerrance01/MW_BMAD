import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Form, Button, Card, Row, Col, Alert, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import { createOrder, resetOrderState } from "../../store/cartSlice";

// Validation schema for checkout form
const checkoutSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  address: Yup.string().required("Address is required"),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  zipCode: Yup.string().required("ZIP code is required"),
  country: Yup.string().required("Country is required"),
  paymentMethod: Yup.string().required("Payment method is required"),
  cardName: Yup.string().when("paymentMethod", {
    is: "creditCard",
    then: () => Yup.string().required("Name on card is required"),
    otherwise: () => Yup.string(),
  }),
  cardNumber: Yup.string().when("paymentMethod", {
    is: "creditCard",
    then: () =>
      Yup.string()
        .required("Card number is required")
        .matches(/^\d{16}$/, "Card number must be 16 digits"),
    otherwise: () => Yup.string(),
  }),
  expiryDate: Yup.string().when("paymentMethod", {
    is: "creditCard",
    then: () =>
      Yup.string()
        .required("Expiry date is required")
        .matches(
          /^(0[1-9]|1[0-2])\/\d{2}$/,
          "Expiry date must be in MM/YY format"
        ),
    otherwise: () => Yup.string(),
  }),
  cvv: Yup.string().when("paymentMethod", {
    is: "creditCard",
    then: () =>
      Yup.string()
        .required("CVV is required")
        .matches(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
    otherwise: () => Yup.string(),
  }),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading, error, orderCreated } = useSelector(
    (state) => state.cart
  );
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);

  // Calculate order totals
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const taxRate = 0.08; // 8% tax rate
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  // Initial form values
  const initialValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    paymentMethod: "creditCard",
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  };

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (items.length === 0 && !orderCreated) {
      navigate("/cart");
    }

    // Redirect to order confirmation if order is created
    if (orderCreated) {
      navigate(`/order-confirmation/${orderCreated.id}`);
    }

    // Cleanup on unmount
    return () => {
      if (orderCreated) {
        dispatch(resetOrderState());
      }
    };
  }, [items.length, orderCreated, navigate, dispatch]);

  const handleSubmit = (values) => {
    // Create order
    const orderData = {
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: {
        firstName: values.firstName,
        lastName: values.lastName,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
      },
      paymentMethod: values.paymentMethod,
      paymentDetails:
        values.paymentMethod === "creditCard"
          ? {
              cardName: values.cardName,
              cardNumber: values.cardNumber,
              expiryDate: values.expiryDate,
              cvv: values.cvv,
            }
          : null,
    };

    dispatch(createOrder(orderData));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Custom form control styles
  const formControlStyle = {
    backgroundColor: "var(--bg-tertiary)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  const buttonPrimaryStyle = {
    backgroundColor: "var(--accent-primary)",
    borderColor: "var(--accent-primary)",
    color: "#000",
  };

  const buttonSecondaryStyle = {
    backgroundColor: "transparent",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Checkout</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col lg={8}>
          <Card
            className="mb-4"
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
              <div className="d-flex justify-content-between">
                <h5 className="mb-0">
                  {step === 1 ? "Shipping Information" : "Payment Information"}
                </h5>
                <div>Step {step} of 2</div>
              </div>
            </Card.Header>
            <Card.Body>
              <Formik
                initialValues={initialValues}
                validationSchema={checkoutSchema}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isValid,
                }) => (
                  <Form onSubmit={handleSubmit}>
                    {step === 1 && (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>First Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="firstName"
                                value={values.firstName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={
                                  touched.firstName && errors.firstName
                                }
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.firstName}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Last Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="lastName"
                                value={values.lastName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.lastName && errors.lastName}
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.lastName}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.email && errors.email}
                            style={formControlStyle}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Address</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={values.address}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.address && errors.address}
                            style={formControlStyle}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.address}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>City</Form.Label>
                              <Form.Control
                                type="text"
                                name="city"
                                value={values.city}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.city && errors.city}
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.city}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>State</Form.Label>
                              <Form.Control
                                type="text"
                                name="state"
                                value={values.state}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.state && errors.state}
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.state}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>ZIP Code</Form.Label>
                              <Form.Control
                                type="text"
                                name="zipCode"
                                value={values.zipCode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.zipCode && errors.zipCode}
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.zipCode}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Country</Form.Label>
                              <Form.Select
                                name="country"
                                value={values.country}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.country && errors.country}
                                style={formControlStyle}
                              >
                                <option value="">Select Country</option>
                                <option value="United States">
                                  United States
                                </option>
                                <option value="Canada">Canada</option>
                                <option value="United Kingdom">
                                  United Kingdom
                                </option>
                                <option value="Australia">Australia</option>
                                <option value="Germany">Germany</option>
                                <option value="France">France</option>
                                <option value="Japan">Japan</option>
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">
                                {errors.country}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                          <Button
                            style={buttonPrimaryStyle}
                            onClick={nextStep}
                            disabled={
                              !values.firstName ||
                              !values.lastName ||
                              !values.email ||
                              !values.address ||
                              !values.city ||
                              !values.state ||
                              !values.zipCode ||
                              !values.country
                            }
                          >
                            Next: Payment
                          </Button>
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <Form.Group className="mb-4">
                          <Form.Label>Payment Method</Form.Label>
                          <div>
                            <Form.Check
                              type="radio"
                              label="Credit Card"
                              name="paymentMethod"
                              id="creditCard"
                              value="creditCard"
                              checked={values.paymentMethod === "creditCard"}
                              onChange={handleChange}
                              className="mb-2"
                            />
                            <Form.Check
                              type="radio"
                              label="PayPal"
                              name="paymentMethod"
                              id="paypal"
                              value="paypal"
                              checked={values.paymentMethod === "paypal"}
                              onChange={handleChange}
                              className="mb-2"
                            />
                          </div>
                        </Form.Group>

                        {values.paymentMethod === "creditCard" && (
                          <>
                            <Form.Group className="mb-3">
                              <Form.Label>Name on Card</Form.Label>
                              <Form.Control
                                type="text"
                                name="cardName"
                                value={values.cardName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.cardName && errors.cardName}
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.cardName}
                              </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Card Number</Form.Label>
                              <Form.Control
                                type="text"
                                name="cardNumber"
                                value={values.cardNumber}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={
                                  touched.cardNumber && errors.cardNumber
                                }
                                placeholder="1234 5678 9012 3456"
                                style={formControlStyle}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.cardNumber}
                              </Form.Control.Feedback>
                            </Form.Group>

                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Expiration Date</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="expiryDate"
                                    value={values.expiryDate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={
                                      touched.expiryDate && errors.expiryDate
                                    }
                                    placeholder="MM/YY"
                                    style={formControlStyle}
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {errors.expiryDate}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>CVV</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="cvv"
                                    value={values.cvv}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touched.cvv && errors.cvv}
                                    placeholder="123"
                                    style={formControlStyle}
                                  />
                                  <Form.Control.Feedback type="invalid">
                                    {errors.cvv}
                                  </Form.Control.Feedback>
                                </Form.Group>
                              </Col>
                            </Row>
                          </>
                        )}

                        {values.paymentMethod === "paypal" && (
                          <Alert
                            variant="info"
                            style={{
                              backgroundColor: "rgba(0, 200, 255, 0.1)",
                              color: "var(--text-primary)",
                              borderColor: "var(--accent-primary)",
                            }}
                          >
                            You will be redirected to PayPal to complete your
                            payment after placing the order.
                          </Alert>
                        )}

                        <div className="d-flex justify-content-between mt-4">
                          <Button
                            style={buttonSecondaryStyle}
                            onClick={prevStep}
                          >
                            Back
                          </Button>
                          <Button
                            style={buttonPrimaryStyle}
                            type="submit"
                            disabled={
                              loading ||
                              (values.paymentMethod === "creditCard" &&
                                (!values.cardName ||
                                  !values.cardNumber ||
                                  !values.expiryDate ||
                                  !values.cvv ||
                                  errors.cardName ||
                                  errors.cardNumber ||
                                  errors.expiryDate ||
                                  errors.cvv))
                            }
                          >
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
                                Processing...
                              </>
                            ) : (
                              "Place Order"
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </Form>
                )}
              </Formik>
            </Card.Body>
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
              {items.map((item) => (
                <div
                  key={item.id}
                  className="d-flex justify-content-between mb-2"
                >
                  <div>
                    <span style={{ color: "var(--text-primary)" }}>
                      {item.name}
                    </span>
                    <span
                      style={{ color: "var(--accent-primary)" }}
                      className="ms-2"
                    >
                      x {item.quantity}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-primary)" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <hr style={{ borderColor: "var(--border-color)" }} />
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CheckoutPage;
