import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import { loginUser, clearError } from "../../store/authSlice";
import { FaExclamationTriangle } from "react-icons/fa";

// Validation schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

// Helper function to check if error is related to connection issues
const isConnectionError = (error) => {
  if (!error) return false;

  return (
    error.toLowerCase().includes("connection") ||
    error.toLowerCase().includes("network") ||
    error.toLowerCase().includes("certificate") ||
    error.toLowerCase().includes("fetch") ||
    error.toLowerCase().includes("ssl") ||
    error.toLowerCase().includes("no response")
  );
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );
  const [isConnectionIssue, setIsConnectionIssue] = useState(false);

  // Get redirect path and message from location state
  const from = location.state?.from || "/";
  const message = location.state?.message || "";

  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());

    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from, dispatch]);

  // Check if the error is related to connection issues
  useEffect(() => {
    if (error) {
      setIsConnectionIssue(isConnectionError(error));
    } else {
      setIsConnectionIssue(false);
    }
  }, [error]);

  const handleSubmit = (values) => {
    dispatch(loginUser(values));
  };

  return (
    <div className="d-flex justify-content-center">
      <Card className="shadow" style={{ maxWidth: "450px", width: "100%" }}>
        <Card.Body className="p-5">
          <h2 className="text-center mb-4">Login</h2>

          {error && (
            <Alert
              variant={isConnectionIssue ? "warning" : "danger"}
              className="mb-4"
            >
              {isConnectionIssue ? (
                <>
                  <div className="d-flex align-items-center mb-2">
                    <FaExclamationTriangle
                      className="me-2"
                      style={{ color: "#856404" }}
                    />
                    <strong>Connection Issue Detected</strong>
                  </div>
                  <p className="mb-2">{error}</p>
                  <div className="mt-2 small">
                    <p className="mb-1">
                      <strong>Possible Solutions:</strong>
                    </p>
                    <ul className="ps-3">
                      <li>Check if the API server is running</li>
                      <li>
                        For HTTPS certificate issues, try accessing{" "}
                        <a
                          href="https://localhost:7001"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-underline"
                        >
                          https://localhost:7001
                        </a>{" "}
                        directly in your browser and accept any security
                        warnings
                      </li>
                      <li>Verify your network connection</li>
                    </ul>
                  </div>
                </>
              ) : (
                error
              )}
            </Alert>
          )}

          {message && (
            <Alert variant="info" className="mb-4">
              {message}
            </Alert>
          )}

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
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
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.email && errors.email}
                    placeholder="Enter your email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && errors.password}
                    placeholder="Enter your password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || !isValid}
                    className="mb-3"
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
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>

                <div className="text-center mt-3">
                  <p className="mb-0">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-decoration-none">
                      Register
                    </Link>
                  </p>
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;
