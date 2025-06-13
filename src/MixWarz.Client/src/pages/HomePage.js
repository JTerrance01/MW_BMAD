import React, { useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
// FUTURE: React hooks and components - Temporarily disabled
/*
import { useState } from "react";
import { Card, Badge } from "react-bootstrap";
import { useSelector } from "react-redux";
*/
// FUTURE: Competition and product imports - Temporarily disabled
/*
import { fetchCompetitions } from "../store/competitionSlice";
import { fetchProducts } from "../store/productSlice";
*/
// FUTURE: Community-related imports - Temporarily disabled
/*
import {
  fetchLatestArticles,
  fetchUserActivities,
  fetchNewestUsers,
} from "../store/blogSlice";
*/
import { FaPlay, FaCrown, FaMicrophone, FaTrophy } from "react-icons/fa";
// FUTURE: Cart and competition icons - Temporarily disabled
/*
import { FaShoppingCart, FaClock, FaUsers } from "react-icons/fa";
import { addToCart } from "../store/cartSlice";
*/

// FUTURE: Default competition image - Temporarily disabled
/*
const DEFAULT_COMPETITION_IMAGE = "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
*/

const HomePage = () => {
  const dispatch = useDispatch();
  // FUTURE: Competition and product state - Temporarily disabled
  /*
  const { competitions } = useSelector(
    (state) => state.competitions
  );
  const { products } = useSelector(
    (state) => state.products
  );
  */
  // FUTURE: Community-related state - Temporarily disabled
  /*
  const {
    communitySpotlight,
    loading: blogLoading,
    error: blogError,
  } = useSelector((state) => state.blog);
  */
  // FUTURE: Unused variables - Temporarily disabled
  /*
  const [loadingError, setLoadingError] = useState(false);

  // Generate stable keys for items
  const getCompetitionKey = (competition, index) =>
    competition.id || competition.competitionId || `comp-${index}`;

  const getProductKey = (product, index) =>
    product.id || product.productId || `prod-${index}`;
  */

  // FUTURE: Image error handling state - Temporarily disabled
  /*
  const [failedImages, setFailedImages] = useState(new Set());
  */

  useEffect(() => {
    // FUTURE: Data fetching for competitions and products - Temporarily disabled
    /*
    // Reset error state on component mount
    // setLoadingError(false);

    // Fetch featured competitions with error handling
    dispatch(
      fetchCompetitions({
        status: "Active",
        pageSize: 3,
        page: 1,
        // featured: true - temporarily remove this parameter until backend supports it
      })
    ).catch((error) => {
      console.error("Error fetching competitions:", error);
      // setLoadingError(true);
    });

    // Fetch featured products with error handling
    dispatch(
      fetchProducts({
        pageSize: 4,
        page: 1,
        isActive: "true",
        // featured: true - temporarily remove this parameter until backend supports it
      })
    ).catch((error) => {
      console.error("Error fetching products:", error);
      // setLoadingError(true);
    });
    */

    // FUTURE: Community spotlight data fetching - Temporarily disabled
    /*
    // Fetch community spotlight data
    dispatch(fetchLatestArticles({ pageSize: 1 })).catch((error) => {
      console.error("Error fetching latest articles:", error);
    });

    dispatch(fetchUserActivities({ pageSize: 5 })).catch((error) => {
      console.error("Error fetching user activities:", error);
    });

    dispatch(fetchNewestUsers()).catch((error) => {
      console.error("Error fetching newest users:", error);
    });
    */
  }, [dispatch]);

  // FUTURE: Console logging for competitions and products - Temporarily disabled
  /*
  // Log competitions when they change
  useEffect(() => {
    if (competitions) {
      console.log("Competitions in HomePage:", competitions);
      if (Array.isArray(competitions)) {
        competitions.forEach((comp, index) => {
          console.log(`Competition ${index}:`, comp);
          console.log(`  - ID:`, comp.id || comp.competitionId || "undefined");
          console.log(`  - Title:`, comp.title || "No title");
        });
      }
    }
  }, [competitions]);

  // Log products when they change
  useEffect(() => {
    if (products) {
      console.log("Products in HomePage:", products);
    }
  }, [products]);
  */

  // FUTURE: formatRelativeDate function - Temporarily disabled (used by Community Spotlight)
  /*
  // Format date to a relative time string (e.g., "2 days ago")
  const formatRelativeDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes === 0
          ? "Just now"
          : `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  */

  // FUTURE: Fallback community spotlight items - Temporarily disabled
  /*
  // Fallback community spotlight items if API data is not available
  const fallbackCommunityActivity = [
    {
      id: 1,
      type: "blog",
      title: "5 Tips for Better Mix Engineering",
      author: "MixMaster123",
      date: "2 days ago",
    },
    {
      id: 2,
      type: "forum",
      title: "Best VST plugins for trap production?",
      author: "TrapGod",
      replies: 24,
      date: "12 hours ago",
    },
    {
      id: 3,
      type: "new_member",
      username: "BeatProducer99",
      date: "Just joined",
    },
  ];
  */

  // FUTURE: Helper functions for competitions and products - Temporarily disabled
  /*
  const handleImageError = (competitionId) => {
    setFailedImages(prev => new Set([...prev, competitionId]));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImageUrl: product.imageUrl,
      quantity: 1
    }));
  };
  */

  return (
    <div>
      {/* Elevate Your Sound Section */}
      <section className="elevate-sound-section py-5" style={{ backgroundColor: "var(--bg-primary)" }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="elevate-content">
                <h1 className="display-2 fw-bold mb-4" style={{ color: "var(--text-primary)" }}>
                  Elevate Your
                  <br />
                  <span style={{ color: "var(--accent-primary)" }}>Sound.</span>
                  <br />
                  Prove Your
                  <br />
                  <span style={{ color: "var(--accent-primary)" }}>Skills.</span>
                </h1>
                <p className="lead mb-4 fs-4" style={{ color: "var(--text-secondary)" }}>
                  Join the MixWarz community to compete with producers worldwide, discover 
                  premium sound resources, and take your music production to the next level.
                </p>
                <div className="elevate-cta-buttons">
                  <Button
                    as={Link}
                    to="/competitions"
                    variant="primary"
                    size="lg"
                    className="me-3 mb-3 px-4 py-3"
                  >
                    <FaTrophy className="me-2" />
                    Explore Active Competitions
                  </Button>
                  <Button
                    as={Link}
                    to="/products"
                    variant="outline-light"
                    size="lg"
                    className="mb-3 px-4 py-3"
                  >
                    <FaPlay className="me-2" />
                    Browse Sound Kits
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="position-relative">
                <img
                  src="/img/studio-hero.png"
                  alt="Professional music production studio with mixing console"
                  className="img-fluid rounded-3"
                  style={{
                    transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)"
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Hero Section with Background Image */}
      <div className="hero-welcome-section position-relative overflow-hidden">
        {/* Background Video/Image */}
        <div className="hero-background">
          <img
            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Artist in studio creating music"
            className="w-100 h-100 object-fit-cover"
          />
          <div className="hero-overlay"></div>
        </div>

        {/* Hero Content */}
        <Container className="hero-content position-relative">
          <Row className="justify-content-center text-center">
            <Col lg={10} xl={8}>
              <div className="hero-text-content">
                <p className="hero-subheadline lead mb-5 fs-3" style={{ color: "rgba(255,255,255,0.95)" }}>
                  Browse competitions for free, but join as a paid member to participate in epic music battles and compete for prizes.
                </p>
                <div className="hero-cta">
                  <Button
                    as={Link}
                    to="/pricing"
                    variant="primary"
                    size="lg"
                    className="hero-cta-button px-5 py-4 fs-4 fw-bold"
                  >
                    <FaCrown className="me-3" />
                    Become a Member
                  </Button>
                </div>
                
                {/* Supporting elements */}
                <div className="hero-features mt-5 pt-4">
                  <Row className="justify-content-center">
                    <Col md={4} className="mb-3">
                      <div className="hero-feature-item">
                        <FaMicrophone className="hero-feature-icon mb-2" />
                        <h5 className="fw-bold">Compete Globally</h5>
                        <p className="mb-0">Battle against top producers worldwide</p>
                      </div>
                    </Col>
                    <Col md={4} className="mb-3">
                      <div className="hero-feature-item">
                        <FaTrophy className="hero-feature-icon mb-2" />
                        <h5 className="fw-bold">Win Prizes</h5>
                        <p className="mb-0">Earn recognition and valuable rewards</p>
                      </div>
                    </Col>
                    <Col md={4} className="mb-3">
                      <div className="hero-feature-item">
                        <FaPlay className="hero-feature-icon mb-2" />
                        <h5 className="fw-bold">Premium Resources</h5>
                        <p className="mb-0">Access exclusive sound libraries</p>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* FUTURE: Content sections for competitions and products - Temporarily disabled
      <Container className="content-sections">
        Active Competitions Section - Removed for cleaner homepage
        Featured Products Section - Removed for cleaner homepage
        
        FUTURE: Community Spotlight Section - Temporarily disabled
        When re-enabling, uncomment this entire section:
        <section className="mb-5">
          <h2 className="mb-4">Community Spotlight</h2>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 bg-gradient-spotlight">
                Blog Post Spotlight Content
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 bg-gradient-spotlight">
                Forum Discussion Spotlight Content
              </Card>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <Card className="h-100 border-0 bg-gradient-spotlight">
                New Member Spotlight Content
              </Card>
            </Col>
          </Row>
        </section>
      </Container>
      */}

      {/* Custom CSS */}
      <style>{`
        .hero-welcome-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          margin-bottom: 5rem;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -2;
        }

        .hero-background img {
          filter: brightness(0.4) contrast(1.2);
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 200, 255, 0.15) 0%,
            rgba(18, 18, 18, 0.8) 50%,
            rgba(0, 229, 179, 0.15) 100%
          );
          z-index: -1;
        }

        .hero-content {
          z-index: 1;
          padding: 4rem 0;
        }

        .hero-headline {
          color: var(--text-primary);
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .hero-subheadline {
          color: var(--text-secondary);
          text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.8);
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-cta-button {
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          border: none;
          border-radius: 50px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hero-cta-button:hover {
          transform: translateY(-3px);
          background: linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%);
        }

        .hero-features {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .hero-feature-item {
          color: var(--text-primary);
          text-align: center;
        }

        .hero-feature-icon {
          font-size: 2rem;
          color: var(--accent-primary);
        }

        .content-sections {
          padding-top: 2rem;
        }

        .section-title {
          color: var(--accent-primary);
          font-weight: 600;
        }

        .card-hover {
          transition: all 0.3s ease;
          background: var(--bg-secondary);
          border-radius: 1rem;
        }

        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .product-image {
          height: 200px;
          object-fit: cover;
          border-radius: 1rem 1rem 0 0;
        }

        @media (max-width: 768px) {
          .hero-headline {
            font-size: 2.5rem;
          }
          
          .hero-subheadline {
            font-size: 1.25rem;
          }
          
          .hero-cta-button {
            font-size: 1.1rem;
            padding: 1rem 2rem !important;
          }
          
          .hero-welcome-section {
            min-height: 80vh;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
