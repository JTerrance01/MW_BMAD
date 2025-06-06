import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, Container, Row, Col, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../store/authSlice";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .required("Username is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleSubmit = async (values) => {
    const result = await dispatch(registerUser(values));
    if (!result.error) {
      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Create an Account</h2>

              {registrationSuccess && (
                <Alert variant="success">
                  Registration successful! You will be redirected to the login
                  page.
                </Alert>
              )}

              {error && <Alert variant="danger">{error}</Alert>}

              <Formik
                initialValues={{
                  firstName: "",
                  lastName: "",
                  email: "",
                  username: "",
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, isValid, dirty }) => (
                  <Form>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label htmlFor="firstName" className="form-label">
                            First Name
                          </label>
                          <Field
                            name="firstName"
                            type="text"
                            className={`form-control ${
                              errors.firstName && touched.firstName
                                ? "is-invalid"
                                : ""
                            }`}
                          />
                          <ErrorMessage
                            name="firstName"
                            component="div"
                            className="invalid-feedback"
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label htmlFor="lastName" className="form-label">
                            Last Name
                          </label>
                          <Field
                            name="lastName"
                            type="text"
                            className={`form-control ${
                              errors.lastName && touched.lastName
                                ? "is-invalid"
                                : ""
                            }`}
                          />
                          <ErrorMessage
                            name="lastName"
                            component="div"
                            className="invalid-feedback"
                          />
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <Field
                        name="email"
                        type="email"
                        className={`form-control ${
                          errors.email && touched.email ? "is-invalid" : ""
                        }`}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="invalid-feedback"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="username" className="form-label">
                        Username
                      </label>
                      <Field
                        name="username"
                        type="text"
                        className={`form-control ${
                          errors.username && touched.username
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                      <ErrorMessage
                        name="username"
                        component="div"
                        className="invalid-feedback"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <Field
                        name="password"
                        type="password"
                        className={`form-control ${
                          errors.password && touched.password
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="invalid-feedback"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm Password
                      </label>
                      <Field
                        name="confirmPassword"
                        type="password"
                        className={`form-control ${
                          errors.confirmPassword && touched.confirmPassword
                            ? "is-invalid"
                            : ""
                        }`}
                      />
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="invalid-feedback"
                      />
                    </div>

                    <div className="d-grid gap-2">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={!(isValid && dirty) || loading}
                      >
                        {loading ? "Creating Account..." : "Register"}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>

              <div className="text-center mt-3">
                Already have an account? <Link to="/login">Log in</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
