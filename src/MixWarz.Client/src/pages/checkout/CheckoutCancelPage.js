import React from 'react';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTimesCircle, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

const CheckoutCancelPage = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="bg-dark text-light border-0 shadow">
            <Card.Body className="text-center py-5">
              <div className="mb-4">
                <FaTimesCircle 
                  size={80} 
                  className="text-warning mb-3" 
                />
                <h1 className="h2 mb-3" style={{ color: 'var(--accent-primary)' }}>
                  Payment Cancelled
                </h1>
                <p className="lead text-muted">
                  Your payment was cancelled. No charges were made to your account.
                </p>
              </div>

              <Alert variant="info" className="mb-4">
                <h6 className="mb-2">What happened?</h6>
                <p className="mb-0 small">
                  You cancelled the payment process or closed the payment window. 
                  Your cart items are still saved and ready for checkout.
                </p>
              </Alert>

              <div className="d-grid gap-3">
                <div className="mb-3">
                  <h5 className="mb-3">What would you like to do?</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-secondary rounded">
                        <FaShoppingCart className="text-primary mb-2" size={24} />
                        <h6>Return to Cart</h6>
                        <small className="text-muted">
                          Review your items and try again
                        </small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-3 bg-secondary rounded">
                        <FaArrowLeft className="text-primary mb-2" size={24} />
                        <h6>Continue Shopping</h6>
                        <small className="text-muted">
                          Browse more products
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <Button 
                    as={Link} 
                    to="/cart" 
                    variant="primary"
                    className="me-md-2"
                  >
                    <FaShoppingCart className="me-2" />
                    Return to Cart
                  </Button>
                  <Button 
                    as={Link} 
                    to="/products" 
                    variant="outline-light"
                  >
                    <FaArrowLeft className="me-2" />
                    Continue Shopping
                  </Button>
                </div>

                <div className="mt-4 pt-3 border-top border-secondary">
                  <h6 className="mb-2">Need Help?</h6>
                  <p className="small text-muted mb-3">
                    If you're experiencing issues with checkout, please contact our support team.
                  </p>
                  <Button 
                    as={Link} 
                    to="/support" 
                    variant="outline-info"
                    size="sm"
                  >
                    Contact Support
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

export default CheckoutCancelPage; 