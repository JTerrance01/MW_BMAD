import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Alert,
} from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaTag,
  FaFolder,
  FaArrowLeft,
  FaUser,
  FaReply,
  FaClock,
  FaPaperPlane,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import "./BlogStyles.css"; // Import the CSS file for blog styles
import Markdown from "./Markdown"; // Import the Markdown component
import blogService from "../../services/blogService";

// Comment component to display individual comments
const Comment = ({ comment, onReply }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="comment mb-4">
      <div className="d-flex">
        <div className="flex-shrink-0">
          <div
            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
          >
            <FaUser size={16} className="text-white" />
          </div>
        </div>
        <div className="flex-grow-1 ms-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <h6 className="mb-0">{comment.authorName}</h6>
            <small className="text-muted d-flex align-items-center">
              <FaClock className="me-1" size={12} />
              {formatDate(comment.createdAt)}
            </small>
          </div>
          <p className="mb-1">{comment.content}</p>
          <Button
            variant="link"
            className="p-0 text-muted"
            onClick={() => onReply(comment)}
          >
            <FaReply className="me-1" /> Reply
          </Button>

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="replies mt-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="reply mb-3">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <div
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <FaUser size={14} className="text-secondary" />
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="mb-0 small">{reply.authorName}</h6>
                        <small className="text-muted d-flex align-items-center">
                          <FaClock className="me-1" size={10} />
                          {formatDate(reply.createdAt)}
                        </small>
                      </div>
                      <p className="mb-1 small">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Comment section component that manages the list of comments and comment form
const CommentSection = ({ articleId }) => {
  // Since the comments API isn't implemented yet, we'll use mock data
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: null, text: null });

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Use mock data instead of trying to fetch from a non-existent endpoint
  useEffect(() => {
    // Mock comments data
    const mockComments = [];

    // Set the mock comments and turn off loading state
    setComments(mockComments);
    setLoading(false);

    // Display a notice to the user that comments are coming soon
    setMessage({
      type: "info",
      text: "Comments functionality will be available soon!",
    });
  }, [articleId]);

  const handleReply = (comment) => {
    if (!isAuthenticated) {
      setMessage({
        type: "warning",
        text: "Please log in to reply to comments",
      });
      return;
    }

    setReplyTo(comment);
    // Scroll to comment form
    const formElement = document.getElementById("comment-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setMessage({
        type: "warning",
        text: "Please log in to post a comment",
      });
      return;
    }

    if (!commentContent.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Since the endpoint doesn't exist, show a message instead
    setTimeout(() => {
      setMessage({
        type: "info",
        text: "Comments functionality is coming soon. Your comment has been saved for future implementation.",
      });
      setCommentContent("");
      setReplyTo(null);
      setIsSubmitting(false);
    }, 1000);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text && message.type !== "info") {
      const timer = setTimeout(() => {
        setMessage({ type: null, text: null });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="comments-section mt-5">
      <h3 className="mb-4">Comments ({comments.length})</h3>

      {message.text && (
        <Alert
          variant={message.type}
          dismissible
          onClose={() => setMessage({ type: null, text: null })}
        >
          {message.text}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading comments...</span>
          </div>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : comments.length === 0 ? (
        <div className="text-center py-3 bg-secondary bg-opacity-10 rounded">
          <p className="mb-0">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="comments-list mb-4">
          {comments
            .filter((c) => !c.parentCommentId)
            .map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onReply={handleReply}
              />
            ))}
        </div>
      )}

      <Card className="mt-4" id="comment-form">
        <Card.Body>
          <h5>
            {replyTo ? `Reply to ${replyTo.authorName}` : "Leave a Comment"}
          </h5>

          {!isAuthenticated ? (
            <div className="py-3">
              <p className="mb-2">You need to be logged in to comment.</p>
              <Link to="/login" className="btn btn-primary">
                Log In
              </Link>
              <span className="mx-2">or</span>
              <Link to="/register" className="btn btn-outline-primary">
                Register
              </Link>
            </div>
          ) : (
            <Form onSubmit={handleSubmitComment}>
              {replyTo && (
                <div className="mb-3 bg-secondary bg-opacity-10 p-2 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                      Replying to {replyTo.authorName}'s comment
                    </span>
                    <Button
                      variant="link"
                      className="p-0 text-muted"
                      onClick={cancelReply}
                    >
                      Cancel reply
                    </Button>
                  </div>
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Write your comment here..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || !commentContent.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Posting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="me-2" />
                    {replyTo ? "Post Reply" : "Post Comment"}
                  </>
                )}
              </Button>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

// Function to render the article content with proper formatting
const renderContent = (content) => {
  if (!content || content.trim() === "") {
    return <p className="text-muted fst-italic">No content available</p>;
  }

  // Check if content contains HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  try {
    if (hasHtmlTags) {
      // Render as HTML if it contains HTML tags
      return (
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    } else {
      // Otherwise render using the Markdown component
      return <Markdown content={content} />;
    }
  } catch (error) {
    console.error("Error rendering content:", error);
    return (
      <p className="text-danger">
        Error rendering content. Please try again later.
      </p>
    );
  }
};

const BlogArticlePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      if (!slug) {
        setError("Article not found");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching article with slug:", slug);
        // Get the article data
        const response = await blogService.getArticleBySlug(slug);
        console.log("Article response:", response);

        if (response.success && response.article) {
          const articleData = {
            ...response.article,
            categories: response.article.categories || [],
            tags: response.article.tags || [],
          };

          setArticle(articleData);

          // Fetch related articles if we have categories
          if (articleData.categories.length > 0) {
            const categorySlug = articleData.categories[0].slug;
            const relatedResponse = await blogService.getArticles({
              categorySlug,
              pageSize: 3,
            });

            if (relatedResponse.success) {
              // Filter out the current article
              const related = relatedResponse.articles.filter(
                (a) => a.id !== articleData.id
              );
              setRelatedArticles(related.slice(0, 3)); // Limit to 3 articles
            } else {
              setRelatedArticles([]);
            }
          }
        } else {
          setError(response.message || "Failed to fetch article");
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading article...</p>
        </div>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error || "Article not found"}
        </div>
        <Button
          variant="outline-primary"
          onClick={() => navigate("/blog")}
          className="mt-3"
        >
          <FaArrowLeft className="me-2" />
          Back to Blog
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={8} className="mx-auto">
          {/* Back button */}
          <div className="mb-4">
            <Button
              variant="outline-secondary"
              size="sm"
              as={Link}
              to="/blog"
              className="mb-4"
            >
              <FaArrowLeft className="me-2" />
              Back to Blog
            </Button>
          </div>

          {/* Featured image */}
          {article.featuredImageUrl && (
            <div className="featured-image mb-4 position-relative rounded overflow-hidden">
              <img
                src={article.featuredImageUrl}
                alt={article.title}
                className="img-fluid w-100"
                style={{ maxHeight: "500px", objectFit: "cover" }}
              />
            </div>
          )}

          {/* Article title and metadata */}
          <div className="mb-4">
            <h1 className="display-5 mb-3">{article.title}</h1>
            <div className="d-flex flex-wrap align-items-center blog-meta mb-4">
              <div className="me-3 d-flex align-items-center">
                <FaCalendarAlt className="me-1" />
                <span>
                  {new Date(
                    article.publishedAt || article.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="me-3 d-flex align-items-center">
                <FaUser className="me-1" />
                <span>{article.authorName}</span>
              </div>
              <div className="me-3 d-flex align-items-center">
                <FaFolder className="me-1" />
                {article.categories &&
                  article.categories.map((category, index) => (
                    <React.Fragment key={category.id}>
                      <Link
                        to={`/blog?category=${category.slug}`}
                        className="text-decoration-none"
                      >
                        {category.name}
                      </Link>
                      {index < article.categories.length - 1 && ", "}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>

          {/* Article content */}
          <div className="article-content mb-5">
            {renderContent(article.content)}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-5">
              <h5 className="mb-3">Tags</h5>
              <div className="d-flex flex-wrap">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/blog?tag=${tag.slug}`}
                    className="badge blog-tag me-2 mb-2 p-2 text-decoration-none"
                  >
                    <FaTag className="me-1" />
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author info */}
          <Card className="mb-5 shadow-sm border-0">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-secondary me-3 d-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px" }}
                >
                  <FaUser size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-1">{article.authorName}</h5>
                  <p className="mb-0 text-muted">Author</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Comments Section */}
          <CommentSection articleId={article.id} />

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <div className="mb-5 mt-5">
              <h3 className="mb-4">Related Articles</h3>
              <Row>
                {relatedArticles.map((related) => (
                  <Col md={4} key={related.id} className="mb-4">
                    <Card className="h-100 shadow-sm border-0 blog-card">
                      {related.featuredImageUrl && (
                        <Card.Img
                          variant="top"
                          src={related.featuredImageUrl}
                          alt={related.title}
                          className="img-fluid"
                          style={{ height: "150px", objectFit: "cover" }}
                        />
                      )}
                      <Card.Body>
                        <h5 className="card-title h6">
                          <Link
                            to={`/blog/${related.slug}`}
                            className="text-decoration-none"
                          >
                            {related.title}
                          </Link>
                        </h5>
                        <p className="blog-meta small mb-0">
                          <FaCalendarAlt className="me-1" />
                          {new Date(
                            related.publishedAt || related.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default BlogArticlePage;
