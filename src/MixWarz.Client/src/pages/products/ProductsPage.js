import React, { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Pagination,
  Container,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchCategories,
  setPage,
  setPageSize,
} from "../../store/productSlice"; // Assuming correct path
import { addToCart } from "../../store/cartSlice"; // Assuming correct path
import { FaShoppingCart, FaPlay, FaFilter } from "react-icons/fa";

const ProductsPage = () => {
  const dispatch = useDispatch();
  const {
    products,
    categories,
    loading,
    error,
    totalCount,
    pageSize,
    currentPage,
  } = useSelector((state) => state.products);

  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    searchTerm: "",
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const loadProducts = useCallback(() => {
    const params = {
      page: currentPage,
      pageSize,
      ...filters,
    };

    // Ensure we don't send empty parameters to the API
    Object.keys(params).forEach((key) => {
      if (
        params[key] === "" ||
        params[key] === null ||
        params[key] === undefined
      ) {
        delete params[key];
      }
    });

    console.log("Loading products with cleaned params:", params);
    dispatch(fetchProducts(params));
  }, [dispatch, currentPage, pageSize, filters]);

  useEffect(() => {
    console.log("Component mounted - loading categories");
    dispatch(fetchCategories());
  }, [dispatch]);

  // Initial load of products when component mounts
  useEffect(() => {
    console.log("Initial loading of products");
    loadProducts();
    // Only run on initial mount, not on dependency changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle pageSize changes
  useEffect(() => {
    // Only run after initial load to prevent duplicate calls
    if (products && products.length > 0) {
      console.log("Page size changed, updating product list");

      // When page size changes, we might need to adjust the current page
      // If currentPage is beyond the new totalPages, reset to page 1
      const newTotalPages = Math.ceil(totalCount / pageSize);
      const targetPage = currentPage > newTotalPages ? 1 : currentPage;

      if (targetPage !== currentPage) {
        dispatch(setPage(targetPage));
      }

      const params = {
        page: targetPage,
        pageSize,
        ...filters,
      };

      // Clean up empty parameters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      console.log(
        `Fetching products with new pageSize=${pageSize}, page=${targetPage}`
      );
      dispatch(fetchProducts(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  useEffect(() => {
    console.log("Products updated in component:", products);
    if (products && Array.isArray(products)) {
      console.log("Products array length in component:", products.length);
    }
  }, [products]);

  useEffect(() => {
    console.log("Categories updated in component:", categories);
  }, [categories]);

  // Effect to handle changes in totalCount that might affect pagination
  useEffect(() => {
    // Check if the current page is now beyond the total pages
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
    if (totalCount > 0 && currentPage > maxPage) {
      console.log(
        `Current page ${currentPage} is beyond total pages ${maxPage}, resetting to page 1`
      );
      dispatch(setPage(1));

      const params = {
        page: 1,
        pageSize,
        ...filters,
      };

      // Clean up empty parameters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      dispatch(fetchProducts(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    console.log("Applying filters:", filters);
    dispatch(setPage(1));

    // Explicitly trigger a product fetch with the updated filters
    const params = {
      page: 1,
      pageSize,
      ...filters,
    };

    // Clean up empty parameters
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === null) {
        delete params[key];
      }
    });

    console.log("Fetching products with params:", params);
    dispatch(fetchProducts(params));
  };

  // Corrected handleApplyFilters if immediate load is needed:
  // const handleApplyFilters = (e) => {
  //   if (e) e.preventDefault();
  //   console.log("Applying filters:", filters);
  //   dispatch(setPage(1));
  //   // If loadProducts doesn't re-trigger automatically from page/filter changes effectively,
  //   // you might need a more direct call or ensure dependencies of loadProducts's useEffect are correctly updated.
  //   // Forcing a load after filters are set and page is reset:
  //   // const params = { page: 1, pageSize, ...filters };
  //   // Object.keys(params).forEach((key) => {
  //   //   if (params[key] === "" || params[key] === null) delete params[key];
  //   // });
  //   // dispatch(fetchProducts(params));
  // };

  const handleResetFilters = (e) => {
    if (e) e.preventDefault();
    console.log("Resetting filters");
    setFilters({ category: "", minPrice: "", maxPrice: "", searchTerm: "" });
    dispatch(setPage(1));

    // Explicitly fetch products with reset filters
    dispatch(fetchProducts({ page: 1, pageSize }));
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));

    // Explicitly fetch products with the new page
    const params = {
      page,
      pageSize,
      ...filters,
    };

    // Clean up empty parameters
    Object.keys(params).forEach((key) => {
      if (
        params[key] === "" ||
        params[key] === null ||
        params[key] === undefined
      ) {
        delete params[key];
      }
    });

    console.log("Fetching products for page:", page, "with params:", params);
    dispatch(fetchProducts(params));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
  };

  // Create pagination items with a maximum of 5 visible pages
  const getPaginationItems = () => {
    const maxPagesToShow = 5;
    const paginationItems = [];

    if (totalPages <= maxPagesToShow) {
      // Show all pages if we have 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        paginationItems.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      // Add first page
      paginationItems.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );

      // Calculate range to show around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(currentPage + 1, totalPages - 1);

      // Adjust range if current page is near start or end
      if (currentPage <= 3) {
        endPage = 3;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 2;
      }

      // Add ellipsis if needed before the range
      if (startPage > 2) {
        paginationItems.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      }

      // Add the range of pages
      for (let i = startPage; i <= endPage; i++) {
        paginationItems.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      // Add ellipsis if needed after the range
      if (endPage < totalPages - 1) {
        paginationItems.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }

      // Add last page
      if (totalPages > 1) {
        paginationItems.push(
          <Pagination.Item
            key={totalPages}
            active={totalPages === currentPage}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }

    return paginationItems;
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Products</h1>
        <div className="d-flex align-items-center">
          <Form.Select
            className="me-2"
            onChange={(e) => {
              const newPageSize = Number(e.target.value);
              console.log("Changing page size to:", newPageSize);
              dispatch(setPageSize(newPageSize));
            }}
            value={pageSize}
            style={{ width: "auto" }}
          >
            <option value="8">8 per page</option>
            <option value="12">12 per page</option>
            <option value="16">16 per page</option>
            <option value="24">24 per page</option>
          </Form.Select>
        </div>
      </div>

      <Card className="mb-4 border-0 shadow">
        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Filter Products</h5>
          <Button
            variant="outline-light"
            size="sm"
            onClick={handleResetFilters}
          >
            Clear All
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleApplyFilters}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((category) => (
                        <option
                          key={category.id || category.categoryId}
                          value={category.id || category.categoryId}
                        >
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Loading categories...</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Min Price</Form.Label>
                      <Form.Control
                        type="number"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        placeholder="Min Price"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Price</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="Max Price"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Search</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      name="searchTerm"
                      value={filters.searchTerm}
                      onChange={handleFilterChange}
                      placeholder="Search products"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyFilters();
                        }
                      }}
                    />
                    <Button variant="primary" type="submit">
                      <FaFilter className="me-2" /> Apply
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Refactored Products Grid / Messages Section */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading products...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5 text-danger rounded-xl bg-danger bg-opacity-10 p-4">
          <h4>Error Loading Products</h4>
          <p>{typeof error === "object" ? JSON.stringify(error) : error}</p>
          <Button variant="primary" onClick={loadProducts}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* This IIFE now clearly handles the different states of 'products' after loading is false and no error */}
          {(() => {
            if (!products) {
              // Case: products is null or undefined
              return (
                <Col>
                  <div className="text-center py-5 rounded-xl bg-secondary bg-opacity-10">
                    <h4>Products data is currently unavailable.</h4>
                    <p className="text-muted">
                      This might be a temporary issue.
                    </p>
                    <Button variant="primary" onClick={loadProducts}>
                      Retry
                    </Button>
                  </div>
                </Col>
              );
            }

            if (!Array.isArray(products)) {
              // Case: products is not an array
              return (
                <Col>
                  <div className="text-center py-5 rounded-xl bg-secondary bg-opacity-10">
                    <h4>Products data is not in the expected format.</h4>
                    <p className="text-muted">
                      Received: <pre>{JSON.stringify(products, null, 2)}</pre>
                    </p>
                    <Button variant="primary" onClick={loadProducts}>
                      Retry
                    </Button>
                  </div>
                </Col>
              );
            }

            if (products.length === 0) {
              // Case: products is an empty array
              return (
                <Col>
                  <div className="text-center py-5 rounded-xl bg-secondary bg-opacity-10">
                    <h4>No products found</h4>
                    <p className="text-muted">
                      Try adjusting your filters or search term.
                    </p>
                    <div className="d-flex justify-content-center gap-2 mt-3">
                      <Button
                        variant="outline-primary"
                        onClick={handleResetFilters}
                      >
                        Reset Filters
                      </Button>
                      <Button variant="primary" onClick={loadProducts}>
                        Refresh List
                      </Button>
                    </div>
                  </div>
                </Col>
              );
            }

            // Case: products is a non-empty array - Render the list!
            return (
              <Row>
                {products.map((product, index) => {
                  if (!product) {
                    // Safety check for individual product items
                    console.warn(
                      `Product at index ${index} is null or undefined.`
                    );
                    return null;
                  }
                  const productId =
                    product.id || product.productId || `product-${index}`;
                  const productName = product.name || "Unnamed Product";
                  const productImage =
                    product.imageUrl ||
                    "https://via.placeholder.com/300x200.png?text=No+Image"; // Placeholder
                  const creatorName = product.creatorName || "Producer Name";
                  const price =
                    typeof product.price === "number" ? product.price : 0;
                  const description =
                    product.description || "No description available";

                  // Extract product category
                  const category = product.categoryName || "Unknown Category";

                  // Format creation date if available
                  const createdAt = product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString()
                    : null;

                  return (
                    <Col lg={3} md={6} key={productId} className="mb-4">
                      <Card className="h-100 card-hover border-0 shadow">
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                            src={productImage}
                            alt={productName}
                            className="product-image"
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                          <div className="position-absolute top-0 end-0 m-2">
                            <Button
                              className="preview-btn rounded-circle"
                              aria-label={`Preview ${productName}`}
                              variant="primary"
                              size="sm"
                              style={{
                                width: "36px",
                                height: "36px",
                                padding: "0",
                              }}
                            >
                              <FaPlay />
                            </Button>
                          </div>
                          {category && (
                            <div className="position-absolute top-0 start-0 m-2">
                              <Badge
                                style={{
                                  backgroundColor: "var(--bg-secondary)",
                                  color: "var(--accent-primary)",
                                  borderColor: "var(--accent-primary)",
                                  border: "1px solid",
                                }}
                                pill
                                className="px-2 py-1"
                              >
                                {category}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <Card.Title
                            className="h5 mb-2"
                            style={{ color: "var(--accent-primary)" }}
                          >
                            {productName}
                          </Card.Title>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span
                              className="fw-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {creatorName}
                            </span>
                            {createdAt && (
                              <span
                                className="small"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {createdAt}
                              </span>
                            )}
                          </div>
                          <Card.Text
                            className="text-truncate-2 mb-3 small"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {description}
                          </Card.Text>

                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span
                                className="fw-bold price-tag fs-5"
                                style={{ color: "var(--accent-primary)" }}
                              >
                                ${price.toFixed(2)}
                              </span>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="rounded-circle p-2"
                                onClick={() => handleAddToCart(product)}
                                aria-label={`Add ${productName} to cart`}
                              >
                                <FaShoppingCart />
                              </Button>
                            </div>
                            <Button
                              as={Link}
                              to={`/products/${productId}`}
                              variant="primary"
                              className="w-100"
                            >
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            );
          })()}

          {/* Pagination - Show only if there are products and more than one page */}
          {products && products.length > 0 && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(1)}
                />
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                {getPaginationItems()}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                />
                <Pagination.Last
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(totalPages)}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductsPage;
