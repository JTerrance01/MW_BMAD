import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  fetchProductById,
  clearProductDetail,
  fetchProductDownloadUrl,
  clearDownloadUrl,
} from "../../store/productSlice";
import { addToCart } from "../../store/cartSlice";

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { product, loading, error, downloadUrl } = useSelector(
    (state) => state.products
  );
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      console.log(`Fetching product with ID: ${id}`);
      dispatch(fetchProductById(id));
    } else {
      console.error("No product ID found in URL parameters");
    }

    return () => {
      dispatch(clearProductDetail());
      dispatch(clearDownloadUrl());
    };
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (product) {
      dispatch(
        addToCart({
          ...product,
          quantity,
        })
      );
    }
  };

  const handleDownload = () => {
    if (id) {
      dispatch(fetchProductDownloadUrl(id));
    } else {
      console.error("Cannot fetch download URL: No product ID available");
    }
  };

  // Check if user has purchased this product
  const hasPurchased = user?.purchasedProducts?.includes(id);

  // Early return for loading state
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        <Alert.Heading>Error Loading Product</Alert.Heading>
        <p>{error}</p>
        <div className="d-flex justify-content-end">
          <Link to="/products" className="btn btn-outline-danger">
            Back to Products
          </Link>
        </div>
      </Alert>
    );
  }

  // Early return for missing product
  if (!product) {
    return (
      <Alert variant="warning" className="my-4">
        <Alert.Heading>Product Not Found</Alert.Heading>
        <p>
          The product you're looking for (ID: {id}) could not be found. It may
          have been removed or the link is incorrect.
        </p>
        <div className="d-flex justify-content-end">
          <Link to="/products" className="btn btn-outline-primary">
            Browse All Products
          </Link>
        </div>
      </Alert>
    );
  }

  // Main render when product is available
  return (
    <>
      <Row className="mb-5">
        <Col md={5}>
          <Card className="border-0 shadow">
            <Card.Img
              src={
                product.imageUrl ||
                "https://placehold.co/600x400?text=Product+Image"
              }
              alt={product.name}
              className="rounded"
            />
          </Card>
        </Col>

        <Col md={7}>
          <h1 className="mb-3" style={{ color: "var(--accent-primary)" }}>
            {product.name}
          </h1>{" "}
          <div className="d-flex gap-2 mb-3">
            {" "}
            {product.categories?.map((category) => (
              <Badge
                key={category.id || `cat-${category.name}`}
                bg="secondary"
                className="px-3 py-2"
                style={{
                  border: "1px solid var(--accent-primary)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                {" "}
                {category.name}{" "}
              </Badge>
            ))}{" "}
            {(!product.categories || product.categories.length === 0) &&
              product.categoryName && (
                <Badge
                  bg="secondary"
                  className="px-3 py-2"
                  style={{
                    border: "1px solid var(--accent-primary)",
                    color: "var(--text-primary)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  {" "}
                  {product.categoryName}{" "}
                </Badge>
              )}{" "}
          </div>{" "}
          <h3 className="mb-4" style={{ color: "var(--accent-primary)" }}>
            ${product.price.toFixed(2)}
          </h3>{" "}
          <div className="mb-4">
            {" "}
            <p style={{ color: "var(--text-primary)", lineHeight: "1.6" }}>
              {product.description}
            </p>{" "}
          </div>
          {product.inStock !== false ? (
            <div className="d-flex align-items-center mb-4">
              <Badge bg="success" className="me-2 px-3 py-2">
                In Stock
              </Badge>
              {hasPurchased ? (
                <Button variant="success" onClick={handleDownload}>
                  Download
                </Button>
              ) : (
                <div className="d-flex gap-3">
                  <div style={{ width: "100px" }}>
                    <input
                      type="number"
                      className="form-control"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      min="1"
                    />
                  </div>
                  <Button variant="primary" onClick={handleAddToCart}>
                    Add to Cart
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Badge bg="danger" className="px-3 py-2 mb-4">
              Out of Stock
            </Badge>
          )}
          {downloadUrl && (
            <Alert variant="success">
              Your download is ready!{" "}
              <a href={downloadUrl} className="alert-link" download>
                Click here
              </a>{" "}
              to download.
            </Alert>
          )}
          <div className="d-flex gap-2 mt-4">
            <Link to="/products" className="btn btn-outline-secondary">
              Back to Products
            </Link>
          </div>
        </Col>
      </Row>

      <Tabs defaultActiveKey="details" className="mb-4">
        <Tab eventKey="details" title="Details">
          <Card body>
            <Row>
              <Col md={6}>
                <h5 style={{ color: "var(--accent-primary)" }}>
                  Specifications
                </h5>{" "}
                <ul
                  className="list-unstyled"
                  style={{ color: "var(--text-primary)" }}
                >
                  {" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Format:
                    </strong>{" "}
                    {product.format || "Digital Download"}{" "}
                  </li>{" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      File Size:
                    </strong>{" "}
                    {product.fileSize || "Varies"}{" "}
                  </li>{" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Sample Rate:
                    </strong>{" "}
                    {product.sampleRate || "44.1kHz / 48kHz"}{" "}
                  </li>{" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Compatibility:
                    </strong>{" "}
                    {product.compatibility || "All Major DAWs"}{" "}
                  </li>{" "}
                </ul>
              </Col>
              <Col md={6}>
                <h5 style={{ color: "var(--accent-primary)" }}>
                  Additional Information
                </h5>{" "}
                <ul
                  className="list-unstyled"
                  style={{ color: "var(--text-primary)" }}
                >
                  {" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Released:
                    </strong>{" "}
                    {new Date(
                      product.releaseDate || Date.now()
                    ).toLocaleDateString()}{" "}
                  </li>{" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      Version:
                    </strong>{" "}
                    {product.version || "1.0"}{" "}
                  </li>{" "}
                  <li className="mb-2">
                    {" "}
                    <strong style={{ color: "var(--accent-primary)" }}>
                      License:
                    </strong>{" "}
                    {product.license || "Single User License"}{" "}
                  </li>{" "}
                </ul>
              </Col>
            </Row>
          </Card>
        </Tab>
        <Tab eventKey="requirements" title="System Requirements">
          <Card body>
            {" "}
            <p style={{ color: "var(--text-primary)", lineHeight: "1.6" }}>
              {" "}
              {product.systemRequirements ||
                "Compatible with all major Digital Audio Workstations (DAWs). No special system requirements needed."}{" "}
            </p>{" "}
          </Card>
        </Tab>
        <Tab eventKey="reviews" title="Reviews">
          {" "}
          <Card body>
            {" "}
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="mb-3 pb-3 border-bottom"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  {" "}
                  <div className="d-flex justify-content-between">
                    {" "}
                    <h5 style={{ color: "var(--accent-primary)" }}>
                      {review.title}
                    </h5>{" "}
                    <div>
                      {" "}
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={{
                            color:
                              i < review.rating
                                ? "var(--warning)"
                                : "var(--text-muted)",
                          }}
                        >
                          {" "}
                          ★{" "}
                        </span>
                      ))}{" "}
                    </div>{" "}
                  </div>{" "}
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontWeight: "var(--font-weight-medium)",
                    }}
                    className="small"
                  >
                    {" "}
                    By {review.userName} on{" "}
                    {new Date(review.date).toLocaleDateString()}{" "}
                  </p>{" "}
                  <p style={{ color: "var(--text-primary)" }}>
                    {review.comment}
                  </p>{" "}
                </div>
              ))
            ) : (
              <p
                className="text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                {" "}
                No reviews yet. Be the first to review this product!{" "}
              </p>
            )}
            {isAuthenticated && (
              <div className="mt-4 text-center">
                <Button variant="outline-primary">Write a Review</Button>
              </div>
            )}
          </Card>
        </Tab>
      </Tabs>

      {/* Related Products Section */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-4">Related Products</h3>
          <Row>
            {product.relatedProducts.map((relatedProduct) => (
              <Col md={3} key={relatedProduct.id} className="mb-4">
                {" "}
                <Card className="h-100 card-hover">
                  {" "}
                  <div className="position-relative">
                    {" "}
                    <Card.Img
                      variant="top"
                      src={
                        relatedProduct.imageUrl ||
                        "https://placehold.co/600x200?text=Related+Product"
                      }
                      alt={relatedProduct.name}
                      className="product-image"
                    />{" "}
                    {/* Add an overlay with gradient for better text contrast */}{" "}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
                        borderRadius:
                          "calc(var(--border-radius-md) - 1px) calc(var(--border-radius-md) - 1px) 0 0",
                      }}
                    ></div>{" "}
                  </div>{" "}
                  <Card.Body>
                    {" "}
                    <Card.Title style={{ color: "var(--accent-primary)" }}>
                      {relatedProduct.name}
                    </Card.Title>{" "}
                    <Card.Text
                      className="text-truncate-2 mb-3"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {" "}
                      {relatedProduct.description}{" "}
                    </Card.Text>{" "}
                    <div className="d-flex justify-content-between align-items-center">
                      {" "}
                      <h5
                        className="mb-0"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {" "}
                        ${relatedProduct.price.toFixed(2)}{" "}
                      </h5>{" "}
                      <Button
                        as={Link}
                        to={`/products/${relatedProduct.id}`}
                        variant="outline-primary"
                      >
                        {" "}
                        View Details{" "}
                      </Button>{" "}
                    </div>{" "}
                  </Card.Body>{" "}
                </Card>{" "}
              </Col>
            ))}
          </Row>
        </div>
      )}
    </>
  );
};

export default ProductDetailPage;
