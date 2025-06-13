import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaShoppingBag, FaDownload } from 'react-icons/fa';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate checking session status
    // In a real implementation, you might verify the session with your backend
    setTimeout(() => {
      setSessionStatus('complete');
      setLoading(false);
    }, 2000);
  }, [sessionId]);

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="bg-dark text-light border-0 shadow">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h3>Processing your payment...</h3>
                <p className="text-muted">Please wait while we confirm your order.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Alert variant="danger">
              <h4>Payment Verification Failed</h4>
              <p>{error}</p>
              <Button as={Link} to="/cart" variant="outline-light">
                Return to Cart
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="bg-dark text-light border-0 shadow">
            <Card.Body className="text-center py-5">
              <div className="mb-4">
                <FaCheckCircle 
                  size={80} 
                  className="text-success mb-3" 
                />
                <h1 className="h2 mb-3" style={{ color: 'var(--accent-primary)' }}>
                  Payment Successful!
                </h1>
                <p className="lead text-muted">
                  Thank you for your purchase. Your order has been confirmed.
                </p>
              </div>

              {sessionId && (
                <Alert variant="info" className="mb-4">
                  <small>
                    <strong>Session ID:</strong> {sessionId.substring(0, 20)}...
                  </small>
                </Alert>
              )}

              <div className="d-grid gap-3">
                <div className="mb-3">
                  <h5 className="mb-3">What's Next?</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-secondary rounded">
                        <FaDownload className="text-primary mb-2" size={24} />
                        <h6>Digital Products</h6>
                        <small className="text-muted">
                          Access your downloads in your account
                        </small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-3 bg-secondary rounded">
                        <FaShoppingBag className="text-primary mb-2" size={24} />
                        <h6>Physical Products</h6>
                        <small className="text-muted">
                          We'll send shipping confirmation soon
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <Button 
                    as={Link} 
                    to="/profile" 
                    variant="primary"
                    className="me-md-2"
                  >
                    View My Account
                  </Button>
                  <Button 
                    as={Link} 
                    to="/products" 
                    variant="outline-light"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutSuccessPage; 