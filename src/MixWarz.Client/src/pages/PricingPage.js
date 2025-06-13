import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ListGroup,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaCrown,
  FaTrophy,
  FaMusic,
  FaUsers,
  FaStar,
  FaCheck,
  FaGem,
  FaRocket,
} from "react-icons/fa";
import { proceedToSubscriptionCheckout } from "../services/subscriptionService";

const PricingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null); // Track which tier is loading
  const [error, setError] = useState(null);

  const handleSubscribe = async (tier) => {
    setError(null);

    // Check authentication
    if (!isAuthenticated) {
      setError("Please log in to subscribe to a membership plan.");
      navigate("/login");
      return;
    }

    // Handle free tier
    if (tier === "Apprentice") {
      navigate("/register");
      return;
    }

    // Map tier names to subscription types
    const subscriptionTypeMap = {
      "Warrior": "producer",
      "Legend": "legend"
    };

    const subscriptionType = subscriptionTypeMap[tier];
    if (!subscriptionType) {
      setError("Invalid subscription tier selected.");
      return;
    }

    setLoading(true);
    setLoadingTier(tier); // Track which specific tier is loading
    try {
      console.log(`🚀 Proceeding to ${tier} subscription checkout`);
      await proceedToSubscriptionCheckout(subscriptionType);
    } catch (err) {
      console.error("Subscription checkout failed:", err);
      setError(err.message || "Failed to start subscription checkout. Please try again.");
    } finally {
      setLoading(false);
      setLoadingTier(null); // Clear the loading tier
    }
  };

  const pricingTiers = [
    {
      id: "free",
      name: "Apprentice",
      price: 0,
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Browse competitions",
        "View community content",
        "Basic profile setup",
        "Limited product access",
      ],
      limitations: [
        "Cannot submit to competitions",
        "No voting rights",
        "Limited downloads",
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline-primary",
      icon: FaMusic,
      popular: false,
    },
    {
      id: "producer",
      name: "Warrior",
      price: 19.99,
      period: "month",
      description: "For serious music creators",
      features: [
        "Submit to all competitions",
        "Vote in competitions",
        "Access to sound libraries",
        "Premium customer support",
        "Community forum access",
        "Monthly exclusive content",
      ],
      buttonText: "Become a Mix Warrior",
      buttonVariant: "primary",
      icon: FaCrown,
      popular: true,
    },
    {
      id: "legend",
      name: "Legend",
      price: 29.99,
      period: "month",
      description: "The ultimate music battle experience",
      features: [
        "Everything in Producer",
        "Priority competition entry",
        "Exclusive Legend competitions",
        "Advanced analytics & feedback",
        "1-on-1 mentorship sessions",
        "Early access to new features",
        "Unlimited downloads",
        "Commercial license included",
      ],
      buttonText: "Become a Legend",
      buttonVariant: "warning",
      icon: FaGem,
      popular: false,
    },
  ];

  return (
    <div className="pricing-page">
      {/* Hero Section */}
      <section className="pricing-hero py-5">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <h1 className="display-4 fw-bold mb-4">
                Choose Your Path to
                <span className="text-gradient"> Musical Greatness</span>
              </h1>
              <p className="lead mb-5">
                Join thousands of producers worldwide in the ultimate music battle platform.
                Start your journey today and unlock your potential.
              </p>
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-section py-5">
        <Container>
          <Row className="justify-content-center">
            {pricingTiers.map((tier) => {
              const IconComponent = tier.icon;
              return (
                <Col lg={4} md={6} key={tier.id} className="mb-4">
                  <Card
                    className={`pricing-card h-100 position-relative ${
                      tier.popular ? "popular-card" : ""
                    }`}
                  >
                    {tier.popular && (
                      <Badge className="popular-badge position-absolute">
                        <FaStar className="me-1" />
                        Most Popular
                      </Badge>
                    )}
                    
                    <Card.Body className="text-center p-4">
                      <div className="pricing-icon mb-3">
                        <IconComponent />
                      </div>
                      
                      <h3 className="pricing-title mb-3">{tier.name}</h3>
                      
                      <div className="pricing-price mb-3">
                        <span className="price-amount">
                          ${tier.price}
                        </span>
                        <span className="price-period">/{tier.period}</span>
                      </div>
                      
                      <p className="pricing-description mb-4">
                        {tier.description}
                      </p>
                      
                      <Button
                        variant={tier.buttonVariant}
                        size="lg"
                        className="pricing-button mb-4"
                        onClick={() => handleSubscribe(tier.name)}
                        disabled={loading}
                      >
                        {loadingTier === tier.name ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              className="me-2"
                            />
                            Processing...
                          </>
                        ) : (
                          tier.buttonText
                        )}
                      </Button>
                      
                      <ListGroup variant="flush" className="text-start">
                        {tier.features.map((feature, index) => (
                          <ListGroup.Item
                            key={index}
                            className="pricing-feature border-0 px-0"
                          >
                            <FaCheck className="feature-check me-2" />
                            {feature}
                          </ListGroup.Item>
                        ))}
                        {tier.limitations && tier.limitations.map((limitation, index) => (
                          <ListGroup.Item
                            key={`limit-${index}`}
                            className="pricing-limitation border-0 px-0"
                          >
                            <span className="limitation-text">
                              {limitation}
                            </span>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* Features Highlight */}
      <section className="features-highlight py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title mb-4">Why Choose MixWarz?</h2>
              <p className="lead">
                Join the most competitive and rewarding music production community
              </p>
            </Col>
          </Row>
          
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="feature-highlight">
                <FaTrophy className="feature-highlight-icon mb-3" />
                <h4>Compete & Win</h4>
                <p>Battle against top producers worldwide and win valuable prizes</p>
              </div>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="feature-highlight">
                <FaUsers className="feature-highlight-icon mb-3" />
                <h4>Global Community</h4>
                <p>Connect with like-minded producers and expand your network</p>
              </div>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="feature-highlight">
                <FaRocket className="feature-highlight-icon mb-3" />
                <h4>Level Up</h4>
                <p>Access premium resources and mentorship to enhance your skills</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5">
        <Container>
          <Row>
            <Col lg={8} className="mx-auto">
              <h2 className="text-center section-title mb-5">
                Frequently Asked Questions
              </h2>
              
              <div className="faq-item mb-4">
                <h5 className="faq-question">Can I cancel my subscription anytime?</h5>
                <p className="faq-answer">
                  Yes, you can cancel your subscription at any time. You'll continue to have access 
                  to premium features until the end of your current billing period.
                </p>
              </div>
              
              <div className="faq-item mb-4">
                <h5 className="faq-question">What happens to my submissions if I downgrade?</h5>
                <p className="faq-answer">
                  Your previous submissions will remain in competitions, but you won't be able 
                  to submit to new competitions until you upgrade again.
                </p>
              </div>
              
              <div className="faq-item mb-4">
                <h5 className="faq-question">Do you offer student discounts?</h5>
                <p className="faq-answer">
                  We're working on student pricing! Join our newsletter to be notified when 
                  student discounts become available.
                </p>
              </div>
              
              <div className="text-center mt-5">
                <p>Still have questions?</p>
                <Button as={Link} to="/contact" variant="outline-primary">
                  Contact Support
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Custom CSS */}
      <style>{`
        .pricing-page {
          background: var(--bg-primary);
          min-height: 100vh;
          padding-top: 2rem;
        }

        .pricing-hero {
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-card {
          background: var(--bg-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .pricing-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .popular-card {
          border: 2px solid var(--accent-primary);
          box-shadow: 0 10px 30px rgba(0, 200, 255, 0.2);
        }

        .popular-badge {
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }

        .pricing-icon {
          font-size: 3rem;
          color: var(--accent-primary);
        }

        .pricing-title {
          color: var(--text-primary);
          font-weight: 600;
        }

        .pricing-price {
          color: var(--text-primary);
        }

        .price-amount {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--accent-primary);
        }

        .price-period {
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .pricing-description {
          color: var(--text-secondary);
        }

        .pricing-button {
          width: 100%;
          border-radius: 50px;
          padding: 0.75rem 2rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pricing-feature {
          background: transparent;
          color: var(--text-primary);
          padding: 0.5rem 0;
        }

        .feature-check {
          color: var(--accent-secondary);
        }

        .pricing-limitation {
          background: transparent;
          color: var(--text-secondary);
          padding: 0.25rem 0;
          font-size: 0.9rem;
        }

        .limitation-text {
          opacity: 0.7;
        }

        .section-title {
          color: var(--accent-primary);
          font-weight: 600;
        }

        .features-highlight {
          background: var(--bg-secondary);
        }

        .feature-highlight-icon {
          font-size: 3rem;
          color: var(--accent-primary);
        }

        .feature-highlight h4 {
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .feature-highlight p {
          color: var(--text-secondary);
        }

        .faq-section {
          background: var(--bg-primary);
        }

        .faq-question {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .faq-answer {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .faq-item {
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .faq-item:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .pricing-card {
            margin-bottom: 2rem;
          }
          
          .price-amount {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PricingPage; 