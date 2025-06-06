import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Pagination,
  Badge,
} from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { FaCalendarAlt, FaTag, FaFolder } from "react-icons/fa";
import blogService from "../../services/blogService";
import "./BlogStyles.css";

// ArticleCard component for displaying a blog article in the grid
const ArticleCard = ({ article }) => {
  return (
    <Card className="mb-4 shadow-sm border-0 blog-card h-100">
      {article.featuredImageUrl && (
        <div className="position-relative">
          <Card.Img
            variant="top"
            src={article.featuredImageUrl}
            alt={article.title}
            className="img-fluid"
            style={{ maxHeight: "220px", objectFit: "cover" }}
          />
          {/* Add an overlay with gradient to improve text contrast on the image */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)",
              borderRadius:
                "calc(var(--border-radius-md) - 1px) calc(var(--border-radius-md) - 1px) 0 0",
            }}
          ></div>
        </div>
      )}
      <Card.Body className="p-4 d-flex flex-column">
        <h2 className="h4 mb-3">
          <Link
            to={`/blog/${article.slug}`}
            className="text-decoration-none"
            style={{ color: "var(--accent-primary)" }}
          >
            {article.title}
          </Link>
        </h2>
        <div className="d-flex flex-wrap mb-3 blog-meta">
          <div className="me-3 d-flex align-items-center">
            <FaCalendarAlt
              className="me-1"
              style={{ color: "var(--accent-primary)" }}
            />
            <span style={{ color: "var(--text-secondary)" }}>
              {new Date(
                article.publishedAt || article.createdAt
              ).toLocaleDateString()}
            </span>
          </div>
          <div className="me-3 d-flex align-items-center">
            <FaFolder
              className="me-1"
              style={{ color: "var(--accent-primary)" }}
            />
            {article.categories.map((category, i) => (
              <span
                key={category.id}
                style={{ color: "var(--text-secondary)" }}
              >
                <Link
                  to={`/blog?category=${category.slug}`}
                  className="text-decoration-none"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {category.name}
                </Link>
                {i < article.categories.length - 1 && ", "}
              </span>
            ))}
          </div>
        </div>
        <Card.Text
          className="flex-grow-1"
          style={{ color: "var(--text-primary)" }}
        >
          {article.content && article.content.length > 150
            ? `${article.content.substring(0, 150)}...`
            : article.content || "No content available"}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/blog?tag=${tag.slug}`}
                className="badge blog-tag me-1 mb-1 text-decoration-none"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--accent-primary)",
                  border: "1px solid var(--accent-primary)",
                }}
              >
                <FaTag className="me-1" />
                {tag.name}
              </Link>
            ))}
          </div>
          <Button
            as={Link}
            to={`/blog/${article.slug}`}
            variant="outline-primary"
            size="sm"
          >
            Read More
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const BlogListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: parseInt(searchParams.get("page") || "1"),
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Get filter parameters from URL
  const categorySlug = searchParams.get("category");
  const tagSlug = searchParams.get("tag");
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch articles
        const params = {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          categorySlug,
          tagSlug,
          search: searchQuery,
        };

        console.log("Fetching articles with params:", params);
        const articlesResponse = await blogService.getArticles(params);
        console.log("Articles response:", articlesResponse);

        if (articlesResponse.success) {
          // Ensure each article has categories and tags initialized
          const articles = articlesResponse.articles.map((article) => ({
            ...article,
            categories: article.categories || [],
            tags: article.tags || [],
          }));

          setArticles(articles);
          setPagination({
            ...pagination,
            totalPages: articlesResponse.totalPages || 1,
            totalItems: articlesResponse.totalItems || 0,
          });
        } else {
          setError(articlesResponse.message || "Failed to fetch articles");
          setArticles([]);
        }

        // Fetch categories
        const categoriesResponse = await blogService.getCategories();
        setCategories(
          categoriesResponse.success ? categoriesResponse.categories || [] : []
        );

        // Fetch tags
        const tagsResponse = await blogService.getTags();
        setTags(tagsResponse.success ? tagsResponse.tags || [] : []);
      } catch (err) {
        console.error("Error in blog page:", err);
        setError("An unexpected error occurred. Please try again later.");
        setArticles([]);
        setCategories([]);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.pageNumber, categorySlug, tagSlug, searchQuery]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    searchParams.set("page", pageNumber.toString());
    setSearchParams(searchParams);
    setPagination({ ...pagination, pageNumber });
    window.scrollTo(0, 0);
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchValue = formData.get("search");

    if (searchValue) {
      searchParams.set("search", searchValue);
    } else {
      searchParams.delete("search");
    }

    searchParams.delete("page"); // Reset to page 1
    setSearchParams(searchParams);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchParams({});
  };

  // Pagination component
  const renderPagination = () => {
    const { pageNumber, totalPages } = pagination;

    if (totalPages <= 1) return null;

    const items = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, pageNumber - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Previous button
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={pageNumber === 1}
        onClick={() => handlePageChange(pageNumber - 1)}
      />
    );

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item
          key={1}
          active={pageNumber === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </Pagination.Item>
      );
      if (startPage > 2) items.push(<Pagination.Ellipsis key="ellipsis1" />);
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={pageNumber === i}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1)
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      items.push(
        <Pagination.Item
          key={totalPages}
          active={pageNumber === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        disabled={pageNumber === totalPages}
        onClick={() => handlePageChange(pageNumber + 1)}
      />
    );

    return (
      <Pagination className="justify-content-center mt-4">{items}</Pagination>
    );
  };

  // Render the main articles grid
  const renderArticlesGrid = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      );
    }

    if (articles.length === 0) {
      return (
        <div className="text-center py-5">
          <h3>No articles found</h3>
          <p>
            {categorySlug && "No articles in this category. "}
            {tagSlug && "No articles with this tag. "}
            {searchQuery && `No results for "${searchQuery}". `}
            {!categorySlug &&
              !tagSlug &&
              !searchQuery &&
              "There are no published articles yet. Check back soon!"}
          </p>
          <Button variant="primary" onClick={handleResetFilters}>
            Clear Filters
          </Button>
        </div>
      );
    }

    return (
      <>
        {/* Filter indicator */}
        {(categorySlug || tagSlug || searchQuery) && (
          <div className="mb-4 p-3 bg-secondary bg-opacity-10 rounded">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Filtering by: </strong>
                {categorySlug && (
                  <Badge
                    className="me-2"
                    style={{
                      backgroundColor: "var(--accent-primary)",
                      color: "var(--bg-primary)",
                    }}
                  >
                    Category:{" "}
                    {categories.find((c) => c.slug === categorySlug)?.name ||
                      categorySlug}
                  </Badge>
                )}
                {tagSlug && (
                  <Badge
                    className="me-2"
                    style={{
                      backgroundColor: "var(--accent-secondary)",
                      color: "var(--bg-primary)",
                    }}
                  >
                    Tag: {tags.find((t) => t.slug === tagSlug)?.name || tagSlug}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge
                    className="me-2"
                    style={{
                      backgroundColor: "var(--accent-primary)",
                      color: "var(--bg-primary)",
                    }}
                  >
                    Search: "{searchQuery}"
                  </Badge>
                )}
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}

        {/* Articles list */}
        <Row>
          {articles.map((article) => (
            <Col key={article.id} lg={6} className="mb-4">
              <ArticleCard article={article} />
            </Col>
          ))}
        </Row>

        {/* Pagination */}
        {renderPagination()}
      </>
    );
  };

  return (
    <Container className="py-5 blog-list-page">
      <Row>
        <Col lg={12} className="mb-5">
          <h1 className="mb-4 text-center">Blog</h1>
          <Form onSubmit={handleSearch} className="mb-5 blog-search-form">
            <div className="d-flex">
              <Form.Control
                type="search"
                name="search"
                placeholder="Search articles..."
                defaultValue={searchQuery || ""}
                className="me-2"
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
              {(categorySlug || tagSlug || searchQuery) && (
                <Button
                  type="button"
                  variant="outline-secondary"
                  className="ms-2"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              )}
            </div>
          </Form>
        </Col>
      </Row>

      <Row>
        {/* Main content */}
        <Col lg={8} className="mb-5 mb-lg-0">
          {renderArticlesGrid()}
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Categories widget */}
          <div className="mb-5 blog-sidebar-widget">
            <h4
              className="mb-3 widget-title"
              style={{ color: "var(--accent-primary)" }}
            >
              Categories
            </h4>
            {loading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : categories.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No categories available
              </p>
            ) : (
              <ul className="list-unstyled blog-categories-list">
                {categories.map((category) => (
                  <li key={category.id} className="mb-2">
                    <Link
                      to={`/blog?category=${category.slug}`}
                      className={`text-decoration-none category-link d-flex justify-content-between ${
                        categorySlug === category.slug ? "active" : ""
                      }`}
                      style={{
                        color:
                          categorySlug === category.slug
                            ? "var(--accent-primary)"
                            : "var(--text-primary)",
                        fontWeight:
                          categorySlug === category.slug ? "600" : "normal",
                      }}
                    >
                      <span>
                        <FaFolder
                          className="me-2"
                          style={{ color: "var(--accent-primary)" }}
                        />
                        {category.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tags widget */}
          <div className="blog-sidebar-widget">
            <h4
              className="mb-3 widget-title"
              style={{ color: "var(--accent-primary)" }}
            >
              Tags
            </h4>
            {loading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : tags.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No tags available
              </p>
            ) : (
              <div className="blog-tags-cloud">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/blog?tag=${tag.slug}`}
                    className={`badge blog-tag text-decoration-none me-2 mb-2 ${
                      tagSlug === tag.slug ? "active" : ""
                    }`}
                    style={{
                      backgroundColor:
                        tagSlug === tag.slug
                          ? "var(--accent-primary)"
                          : "var(--bg-tertiary)",
                      color:
                        tagSlug === tag.slug
                          ? "var(--bg-primary)"
                          : "var(--accent-primary)",
                      border: "1px solid var(--accent-primary)",
                    }}
                  >
                    <FaTag className="me-1" />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default BlogListPage;
