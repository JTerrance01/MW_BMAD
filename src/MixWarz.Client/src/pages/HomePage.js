import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCompetitions } from "../store/competitionSlice";
import { fetchProducts } from "../store/productSlice";
// FUTURE: Community-related imports - Temporarily disabled
/*
import {
  fetchLatestArticles,
  fetchUserActivities,
  fetchNewestUsers,
} from "../store/blogSlice";
*/
import { FaPlay, FaShoppingCart, FaClock, FaUsers } from "react-icons/fa";
import { addToCart } from "../store/cartSlice";

const DEFAULT_COMPETITION_IMAGE = "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const HomePage = () => {
  const dispatch = useDispatch();
  const { competitions } = useSelector(
    (state) => state.competitions
  );
  const { products } = useSelector(
    (state) => state.products
  );
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

  // Image error handling state
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
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

  const handleImageError = (competitionId) => {
    setFailedImages(prev => new Set([...prev, competitionId]));
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section rounded-xl mb-5 py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0 position-relative">
              <div className="text-container">
                <h1 className="display-4 fw-bold mb-4 text-shadow">
                  Elevate Your Sound.
                  <br />
                  Prove Your Skills.
                </h1>
                <p className="lead mb-4 pe-lg-5 text-shadow">
                  Join the MixWarz community to compete with producers
                  worldwide, discover premium sound resources, and take your
                  music production to the next level.
                </p>
                <div className="d-flex gap-3 mt-4">
                  <Button
                    as={Link}
                    to="/competitions"
                    variant="primary"
                    size="lg"
                    className="px-4 py-3"
                  >
                    Explore Active Competitions
                  </Button>
                  <Button
                    as={Link}
                    to="/products"
                    variant="outline-light"
                    size="lg"
                    className="px-4 py-3"
                  >
                    Browse Sound Kits
                  </Button>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-image-container rounded-xl overflow-hidden position-relative">
                <img
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Music producer working on a mix"
                  className="w-100 h-100 object-fit-cover"
                />
                <div className="hero-overlay"></div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* Active Competitions */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Active Competitions</h2>
            <Button
              as={Link}
              to="/competitions"
              variant="link"
              className="text-decoration-none"
            >
              View All
            </Button>
          </div>

          <Row>
            {competitions && competitions.length > 0 ? (
              competitions.map((competition, index) => {
                const competitionId = competition.id || competition.competitionId || `comp-${index}`;
                
                // Determine the image URL to use with error handling
                const hasSpecificImage = competition.imageUrl || competition.coverImageUrl;
                const imageHasFailed = failedImages.has(competitionId);
                
                const competitionImageUrl = (hasSpecificImage && !imageHasFailed) 
                  ? (competition.imageUrl || competition.coverImageUrl)
                  : DEFAULT_COMPETITION_IMAGE;

                return (
                  <Col
                    md={4}
                    key={competitionId}
                    className="mb-4"
                  >
                    <Card className="h-100 card-hover border-0">
                      <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={competitionImageUrl}
                          alt={competition.title}
                          className="product-image"
                          onError={() => {
                            // Only handle error for competition-specific images
                            if (hasSpecificImage && !imageHasFailed) {
                              handleImageError(competitionId);
                            }
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
                          }}
                        ></div>
                        <div className="position-absolute bottom-0 start-0 p-3 w-100">
                          <Badge
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              color: "var(--accent-primary)",
                              border: "1px solid var(--accent-primary)",
                            }}
                            className="me-2 px-2 py-1"
                          >
                            {competition.genre || "Electronic"}
                          </Badge>
                        </div>
                      </div>
                      <Card.Body>
                        <Card.Title
                          className="mb-3"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          {competition.title}
                        </Card.Title>
                        <div className="d-flex align-items-center mb-3 small">
                          <div className="me-3 d-flex align-items-center">
                            <FaClock
                              className="me-1"
                              style={{ color: "var(--accent-primary)" }}
                            />
                            <span style={{ color: "var(--text-secondary)" }}>
                              {new Date(competition.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="d-flex align-items-center">
                            <FaUsers
                              className="me-1"
                              style={{ color: "var(--accent-primary)" }}
                            />
                            <span style={{ color: "var(--text-secondary)" }}>
                              {competition.submissionsCount || "0"} Entries
                            </span>
                          </div>
                        </div>
                        <div className="d-grid">
                          <Button
                            as={Link}
                            to={`/competitions/${
                              competition.id || competition.competitionId
                            }`}
                            variant="outline-primary"
                          >
                            View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col>
                <div className="text-center py-5 rounded-xl bg-secondary bg-opacity-10">
                  <h4 style={{ color: "var(--text-primary)" }}>
                    No active competitions at the moment
                  </h4>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Check back soon or subscribe to our notifications
                  </p>
                  <Button
                    as={Link}
                    to="/competitions/suggest"
                    variant="outline-primary"
                  >
                    Suggest a Competition Theme
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        </section>
        {/* Featured Products */}
        <section className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured Products</h2>
            <Button
              as={Link}
              to="/products"
              variant="link"
              className="text-decoration-none"
            >
              View All
            </Button>
          </div>

          <Row>
            {products && products.length > 0 ? (
              products.map((product, index) => (
                <Col
                  lg={3}
                  md={6}
                  key={product.id || product.productId || `prod-${index}`}
                  className="mb-4"
                >
                  <Card className="h-100 card-hover border-0">
                    <div className="position-relative">
                      <Card.Img
                        variant="top"
                        src={
                          product.imageUrl ||
                          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        }
                        alt={product.name}
                        className="product-image"
                      />
                      {/* Add gradient overlay for better text contrast */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
                        }}
                      ></div>
                      <Button
                        className="preview-btn position-absolute"
                        aria-label={`Preview ${product.name}`}
                      >
                        <FaPlay />
                      </Button>
                    </div>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ color: "var(--text-primary)" }}>
                          {product.creatorName || "Producer Name"}
                        </span>
                        <span
                          className="fw-bold"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <Card.Title
                        className="mb-3"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {product.name}
                      </Card.Title>
                      <div className="d-flex gap-2">
                        <Button
                          as={Link}
                          to={`/products/${product.id || product.productId}`}
                          variant="outline-primary"
                          className="flex-grow-1"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="primary"
                          aria-label={`Add ${product.name} to cart`}
                          onClick={() => dispatch(addToCart(product))}
                        >
                          <FaShoppingCart />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <div className="text-center py-5 rounded-xl bg-secondary bg-opacity-10">
                  <h4 style={{ color: "var(--text-primary)" }}>
                    No featured products available
                  </h4>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Check back soon for new releases
                  </p>
                  <Button as={Link} to="/products" variant="outline-primary">
                    Explore All Products
                  </Button>
                </div>
              </Col>
            )}
          </Row>
        </section>

        {/* FUTURE: Community Spotlight Section - Temporarily disabled
        // When re-enabling, uncomment this entire section:
        // <section className="mb-5">
        //   <h2 className="mb-4">Community Spotlight</h2>
        //   <Row>
        //     <Col lg={4} md={6} className="mb-4">
        //       <Card className="h-100 border-0 bg-gradient-spotlight">
        //         <!-- Blog Post Spotlight Content -->
        //       </Card>
        //     </Col>
        //     <Col lg={4} md={6} className="mb-4">
        //       <Card className="h-100 border-0 bg-gradient-spotlight">
        //         <!-- Forum Discussion Spotlight Content -->
        //       </Card>
        //     </Col>
        //     <Col lg={4} md={6} className="mb-4">
        //       <Card className="h-100 border-0 bg-gradient-spotlight">
        //         <!-- New Member Spotlight Content -->
        //       </Card>
        //     </Col>
        //   </Row>
        // </section>
        */}
      </Container>
    </div>
  );
};

export default HomePage;
