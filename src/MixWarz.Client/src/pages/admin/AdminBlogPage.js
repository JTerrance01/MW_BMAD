import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Tab,
  Nav,
  Form,
  Table,
  Modal,
  Badge,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaTags,
  FaFolder,
  FaImage,
  FaMarkdown,
} from "react-icons/fa";
import { Editor } from "@tinymce/tinymce-react";
import api from "../../services/api";

const AdminBlogPage = () => {
  // State for articles
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("articles");

  // Article form state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleForm, setArticleForm] = useState({
    id: null,
    title: "",
    slug: "",
    content: "",
    featuredImageUrl: "",
    status: "Draft",
    categoryIds: [],
    tagIds: [],
  });

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);

  // Category form state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: "",
    slug: "",
  });

  // Tag form state
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({
    id: null,
    name: "",
    slug: "",
  });

  // Success/error messages
  const [message, setMessage] = useState({ type: null, text: null });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Modal for image upload preview
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // State for editing categories and tags
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingTag, setIsEditingTag] = useState(false);

  // Delete confirmation modal for category
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Delete confirmation modal for tag
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch articles
        const articlesResponse = await api.get("/api/blog/articles", {
          params: { pageSize: 100 }, // Get all articles for admin
        });

        if (articlesResponse.data && articlesResponse.data.articles) {
          setArticles(articlesResponse.data.articles);
        }

        // Fetch categories
        const categoriesResponse = await api.get("/api/blog/categories");
        if (categoriesResponse.data && categoriesResponse.data.categories) {
          setCategories(categoriesResponse.data.categories);
        }

        // Fetch tags
        const tagsResponse = await api.get("/api/blog/tags");
        if (tagsResponse.data && tagsResponse.data.tags) {
          setTags(tagsResponse.data.tags);
        }
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle article form input changes
  const handleArticleInputChange = (e) => {
    const { name, value } = e.target;
    setArticleForm({ ...articleForm, [name]: value });
  };

  // Handle content change from TinyMCE
  const handleEditorChange = (content) => {
    setArticleForm({ ...articleForm, content });
  };

  // Handle category/tag selection
  const handleCheckboxChange = (e, type) => {
    const { value, checked } = e.target;

    if (type === "category") {
      const currentCategoryIds = [...articleForm.categoryIds];

      if (checked) {
        currentCategoryIds.push(parseInt(value));
      } else {
        const index = currentCategoryIds.indexOf(parseInt(value));
        if (index !== -1) {
          currentCategoryIds.splice(index, 1);
        }
      }

      setArticleForm({ ...articleForm, categoryIds: currentCategoryIds });
    } else if (type === "tag") {
      const currentTagIds = [...articleForm.tagIds];

      if (checked) {
        currentTagIds.push(parseInt(value));
      } else {
        const index = currentTagIds.indexOf(parseInt(value));
        if (index !== -1) {
          currentTagIds.splice(index, 1);
        }
      }

      setArticleForm({ ...articleForm, tagIds: currentTagIds });
    }
  };

  // Open edit article modal
  const handleEditArticle = (article) => {
    // Extract category and tag IDs from the article
    const categoryIds = article.categories?.map((cat) => cat.id) || [];
    const tagIds = article.tags?.map((tag) => tag.id) || [];

    setArticleForm({
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      featuredImageUrl: article.featuredImageUrl || "",
      status: article.status,
      categoryIds,
      tagIds,
    });

    setIsEditing(true);
    setShowArticleModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteArticleConfirm = (article) => {
    setArticleToDelete(article);
    setShowDeleteModal(true);
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;

    try {
      const response = await api.delete(
        `/api/blog/articles/${articleToDelete.id}`
      );

      if (response.data.success) {
        // Remove the deleted article from the list
        setArticles(articles.filter((a) => a.id !== articleToDelete.id));
        setShowDeleteModal(false);
        setArticleToDelete(null);
        setMessage({ type: "success", text: "Article deleted successfully!" });
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to delete article",
        });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text:
          err.response?.data?.message ||
          "An error occurred while deleting the article",
      });
    }
  };

  // Reset article form when modal is closed
  const handleCloseArticleModal = () => {
    setArticleForm({
      id: null,
      title: "",
      slug: "",
      content: "",
      featuredImageUrl: "",
      status: "Draft",
      categoryIds: [],
      tagIds: [],
    });
    setIsEditing(false);
    setShowArticleModal(false);
  };

  // Submit article form
  const handleArticleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;

      if (isEditing) {
        // Update existing article        response = await api.put(          `/api/blog/articles/${articleForm.id}`,          articleForm        );

        if (response.data.success) {
          // Update the edited article in the list
          setArticles(
            articles.map((article) =>
              article.id === articleForm.id ? response.data.article : article
            )
          );
          setMessage({
            type: "success",
            text: "Article updated successfully!",
          });
        }
      } else {
        // Create new article        response = await api.post("/api/blog/articles", articleForm);

        if (response.data.success) {
          // Add the new article to the list
          setArticles([...articles, response.data.article]);
          setMessage({
            type: "success",
            text: "Article created successfully!",
          });
        }
      }

      if (response.data.success) {
        handleCloseArticleModal();
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to save article",
        });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text:
          err.response?.data?.message ||
          "An error occurred while saving the article",
      });
    }
  };

  // Edit category functionality
  const handleEditCategory = (category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
    setIsEditingCategory(true);
    setShowCategoryModal(true);
  };

  // Reset category form when modal is closed
  const handleCloseCategoryModal = () => {
    setCategoryForm({
      id: null,
      name: "",
      slug: "",
    });
    setIsEditingCategory(false);
    setShowCategoryModal(false);
  };

  // Delete category confirmation
  const handleDeleteCategoryConfirm = (category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await api.delete(
        `/api/blog/categories/${categoryToDelete.id}`
      );

      if (response.data.success) {
        // Remove the deleted category from the list
        setCategories(categories.filter((c) => c.id !== categoryToDelete.id));
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
        setMessage({
          type: "success",
          text: "Category deleted successfully!",
        });
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to delete category",
        });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text:
          err.response?.data?.message ||
          "An error occurred while deleting the category",
      });
    }
  };

  // Edit tag functionality
  const handleEditTag = (tag) => {
    setTagForm({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    });
    setIsEditingTag(true);
    setShowTagModal(true);
  };

  // Reset tag form when modal is closed
  const handleCloseTagModal = () => {
    setTagForm({
      id: null,
      name: "",
      slug: "",
    });
    setIsEditingTag(false);
    setShowTagModal(false);
  };

  // Delete tag confirmation
  const handleDeleteTagConfirm = (tag) => {
    setTagToDelete(tag);
    setShowDeleteTagModal(true);
  };

  // Delete tag
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      console.log(`Deleting tag with ID: ${tagToDelete.id}`);

      const response = await api.delete(`/api/blog/tags/${tagToDelete.id}`);

      if (response.data.success) {
        // Remove the deleted tag from the list
        setTags(tags.filter((t) => t.id !== tagToDelete.id));
        setShowDeleteTagModal(false);
        setTagToDelete(null);
        setMessage({
          type: "success",
          text: "Tag deleted successfully!",
        });
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to delete tag",
        });
      }
    } catch (err) {
      console.error("Error deleting tag:", err);

      // Handle 404 errors by trying to refresh the tags list
      if (err.response && err.response.status === 404) {
        // Refresh the tags list to ensure we have the latest data
        try {
          const refreshResponse = await api.get("/api/blog/tags");
          if (refreshResponse.data.success) {
            setTags(refreshResponse.data.tags);
          }

          setMessage({
            type: "warning",
            text: "The tag could not be found. The tags list has been refreshed.",
          });
        } catch (refreshError) {
          console.error("Error refreshing tags list:", refreshError);
        }
      } else {
        // Handle other errors
        setMessage({
          type: "danger",
          text:
            err.response?.data?.message ||
            `An error occurred while deleting the tag: ${err.message}`,
        });
      }

      // Close the modal regardless of error
      setShowDeleteTagModal(false);
      setTagToDelete(null);
    }
  };

  // Handle category form input changes
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm({ ...categoryForm, [name]: value });
  };

  // Submit category form
  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    try {
      let response;

      if (isEditingCategory) {
        // Update existing category
        response = await api.put(
          `/api/blog/categories/${categoryForm.id}`,
          categoryForm
        );

        if (response.data.success) {
          // Update the edited category in the list
          setCategories(
            categories.map((category) =>
              category.id === categoryForm.id
                ? response.data.category
                : category
            )
          );
          setMessage({
            type: "success",
            text: "Category updated successfully!",
          });
        }
      } else {
        // Create new category
        response = await api.post("/api/blog/categories", categoryForm);

        if (response.data.success) {
          // Add the new category to the list
          setCategories([...categories, response.data.category]);
          setMessage({
            type: "success",
            text: "Category created successfully!",
          });
        }
      }

      if (response.data.success) {
        handleCloseCategoryModal();
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to save category",
        });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text:
          err.response?.data?.message ||
          "An error occurred while saving the category",
      });
    }
  };

  // Handle tag form input changes
  const handleTagInputChange = (e) => {
    const { name, value } = e.target;
    setTagForm({ ...tagForm, [name]: value });
  };

  // Submit tag form
  const handleTagSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;

      if (isEditingTag) {
        // Update existing tag
        response = await api.put(`/api/blog/tags/${tagForm.id}`, tagForm);

        if (response.data.success) {
          // Update the edited tag in the list
          setTags(
            tags.map((tag) => (tag.id === tagForm.id ? response.data.tag : tag))
          );
          setMessage({
            type: "success",
            text: "Tag updated successfully!",
          });
        }
      } else {
        // Create new tag
        response = await api.post("/api/blog/tags", tagForm);

        if (response.data.success) {
          // Add the new tag to the list
          setTags([...tags, response.data.tag]);
          setMessage({
            type: "success",
            text: "Tag created successfully!",
          });
        }
      }

      if (response.data.success) {
        handleCloseTagModal();
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to save tag",
        });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text:
          err.response?.data?.message ||
          "An error occurred while saving the tag",
      });
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "danger",
        text: "Please select an image file",
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "danger",
        text: "Image size should be less than 5MB",
      });
      return;
    }

    // Create preview URL and show modal
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
    setShowImageModal(true);
  };

  // Upload image to server
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploadingImage(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await api.post("/api/blog/images/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        // Insert image URL into TinyMCE editor
        const imageUrl = response.data.imageUrl;

        // Update the article form's content with the image
        const updatedContent =
          articleForm.content + `\n![Image](${imageUrl})\n`;
        setArticleForm({
          ...articleForm,
          content: updatedContent,
        });

        setMessage({
          type: "success",
          text: "Image uploaded successfully!",
        });
      } else {
        setMessage({
          type: "danger",
          text: response.data.message || "Failed to upload image",
        });
      }
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Error uploading image",
      });
    } finally {
      setUploadingImage(false);
      setShowImageModal(false);
      setImagePreview(null);
      setImageFile(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Cancel image upload
  const handleCancelImageUpload = () => {
    setShowImageModal(false);
    setImagePreview(null);
    setImageFile(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Enhanced TinyMCE configuration with image handling
  const getTinyMCEConfig = () => {
    return {
      height: 400,
      menubar: true,
      plugins: [
        "advlist autolink lists link image charmap print preview anchor",
        "searchreplace visualblocks code fullscreen",
        "insertdatetime media table paste code help wordcount imagetools",
        "codesample emoticons hr nonbreaking pagebreak",
      ],
      toolbar:
        "undo redo | formatselect | bold italic backcolor | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | link image media | codesample | \
        removeformat | help",
      images_upload_handler: async (blobInfo, progress) => {
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append("image", blobInfo.blob(), blobInfo.filename());

          api
            .post("/blog/images/upload", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                progress(percentCompleted);
              },
            })
            .then((response) => {
              if (response.data.success) {
                resolve(response.data.imageUrl);
              } else {
                reject({
                  message: response.data.message || "Failed to upload image",
                });
              }
            })
            .catch((err) => {
              reject({
                message: err.response?.data?.message || "Error uploading image",
              });
            });
        });
      },
      content_style: `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #f8f9fa; background-color: #343a40; }
        img { max-width: 100%; height: auto; }
        blockquote { border-left: 3px solid #6c757d; margin-left: 20px; padding-left: 15px; }
        pre { background-color: #212529; padding: 10px; border-radius: 4px; }
        code { background-color: #212529; padding: 2px 4px; border-radius: 3px; }
      `,
      skin: "oxide-dark",
      content_css: "dark",
    };
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: null, text: null });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-light">Loading blog management...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4 text-primary">Blog Management</h1>

      {message.text && (
        <Alert
          variant={message.type}
          dismissible
          onClose={() => setMessage({ type: null, text: null })}
        >
          {message.text}
        </Alert>
      )}

      <Tab.Container
        id="blog-tabs"
        defaultActiveKey="articles"
        onSelect={setActiveTab}
      >
        <Row>
          <Col>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="articles" className="text-light">
                  Articles
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="categories" className="text-light">
                  Categories
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="tags" className="text-light">
                  Tags
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        <Tab.Content>
          {/* Articles Tab */}
          <Tab.Pane eventKey="articles">
            <Card className="border-0 shadow-sm bg-dark text-light">
              <Card.Header className="bg-dark py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary">Articles</h5>
                  <Button
                    variant="primary"
                    onClick={() => setShowArticleModal(true)}
                  >
                    <FaPlus className="me-2" />
                    New Article
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover variant="dark">
                  <thead>
                    <tr>
                      <th className="text-primary">Title</th>
                      <th className="text-primary">Status</th>
                      <th className="text-primary">Categories</th>
                      <th className="text-primary">Created</th>
                      <th className="text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-3 text-secondary"
                        >
                          No articles found
                        </td>
                      </tr>
                    ) : (
                      articles.map((article) => (
                        <tr key={article.id}>
                          <td className="text-light">{article.title}</td>
                          <td>
                            <Badge
                              bg={
                                article.status === "Published"
                                  ? "success"
                                  : "secondary"
                              }
                            >
                              {article.status}
                            </Badge>
                          </td>
                          <td>
                            {article.categories?.map((category) => (
                              <Badge
                                key={category.id}
                                bg="info"
                                className="me-1"
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </td>
                          <td className="text-secondary">
                            {new Date(article.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditArticle(article)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteArticleConfirm(article)
                              }
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Categories Tab */}
          <Tab.Pane eventKey="categories">
            <Card className="border-0 shadow-sm bg-dark text-light">
              <Card.Header className="bg-dark py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary">Categories</h5>
                  <Button
                    variant="primary"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    <FaPlus className="me-2" />
                    New Category
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover variant="dark">
                  <thead>
                    <tr>
                      <th className="text-primary">Name</th>
                      <th className="text-primary">Slug</th>
                      <th className="text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-3 text-secondary"
                        >
                          No categories found
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category.id}>
                          <td className="text-light">{category.name}</td>
                          <td className="text-secondary">{category.slug}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditCategory(category)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteCategoryConfirm(category)
                              }
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Tags Tab */}
          <Tab.Pane eventKey="tags">
            <Card className="border-0 shadow-sm bg-dark text-light">
              <Card.Header className="bg-dark py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary">Tags</h5>
                  <Button
                    variant="primary"
                    onClick={() => setShowTagModal(true)}
                  >
                    <FaPlus className="me-2" />
                    New Tag
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover variant="dark">
                  <thead>
                    <tr>
                      <th className="text-primary">Name</th>
                      <th className="text-primary">Slug</th>
                      <th className="text-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-3 text-secondary"
                        >
                          No tags found
                        </td>
                      </tr>
                    ) : (
                      tags.map((tag) => (
                        <tr key={tag.id}>
                          <td className="text-light">{tag.name}</td>
                          <td className="text-secondary">{tag.slug}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditTag(tag)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteTagConfirm(tag)}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Article Modal */}
      <Modal
        show={showArticleModal}
        onHide={handleCloseArticleModal}
        size="lg"
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">
            {isEditing ? "Edit Article" : "Create New Article"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleArticleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={articleForm.title}
                onChange={handleArticleInputChange}
                required
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Slug (optional)</Form.Label>
              <Form.Control
                type="text"
                name="slug"
                value={articleForm.slug}
                onChange={handleArticleInputChange}
                placeholder="Will be generated from title if left empty"
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Content</Form.Label>
              <div className="mb-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaImage className="me-1" /> Insert Image
                </Button>
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                />
                <small className="text-secondary">
                  You can also paste or drag images directly into the editor
                </small>
              </div>
              <Editor
                value={articleForm.content}
                init={getTinyMCEConfig()}
                onEditorChange={handleEditorChange}
              />
              <small className="text-secondary mt-1">
                <FaMarkdown className="me-1" />
                Markdown is also supported. Use standard markdown syntax for
                formatting.
              </small>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">
                Featured Image URL
              </Form.Label>
              <Form.Control
                type="text"
                name="featuredImageUrl"
                value={articleForm.featuredImageUrl}
                onChange={handleArticleInputChange}
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Status</Form.Label>
              <Form.Select
                name="status"
                value={articleForm.status}
                onChange={handleArticleInputChange}
                className="bg-secondary text-light"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Categories</Form.Label>
                  <div
                    className="border border-secondary rounded p-3 bg-dark"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    {categories.length === 0 ? (
                      <p className="text-secondary mb-0">
                        No categories available
                      </p>
                    ) : (
                      categories.map((category) => (
                        <Form.Check
                          key={category.id}
                          type="checkbox"
                          id={`category-${category.id}`}
                          label={category.name}
                          value={category.id}
                          checked={articleForm.categoryIds.includes(
                            category.id
                          )}
                          onChange={(e) => handleCheckboxChange(e, "category")}
                          className="mb-2 text-light"
                        />
                      ))
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Tags</Form.Label>
                  <div
                    className="border border-secondary rounded p-3 bg-dark"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    {tags.length === 0 ? (
                      <p className="text-secondary mb-0">No tags available</p>
                    ) : (
                      tags.map((tag) => (
                        <Form.Check
                          key={tag.id}
                          type="checkbox"
                          id={`tag-${tag.id}`}
                          label={tag.name}
                          value={tag.id}
                          checked={articleForm.tagIds.includes(tag.id)}
                          onChange={(e) => handleCheckboxChange(e, "tag")}
                          className="mb-2 text-light"
                        />
                      ))
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary"
                className="me-2"
                onClick={handleCloseArticleModal}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {isEditing ? "Update Article" : "Create Article"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-light">
            Are you sure you want to delete the article "
            {articleToDelete?.title}"?
          </p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer className="border-dark">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteArticle}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Category Modal */}
      <Modal
        show={showCategoryModal}
        onHide={handleCloseCategoryModal}
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">
            {isEditingCategory ? "Edit Category" : "Create New Category"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCategorySubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryInputChange}
                required
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Slug (optional)</Form.Label>
              <Form.Control
                type="text"
                name="slug"
                value={categoryForm.slug}
                onChange={handleCategoryInputChange}
                placeholder="Will be generated from name if left empty"
                className="bg-secondary text-light"
              />
            </Form.Group>

            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary"
                className="me-2"
                onClick={handleCloseCategoryModal}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {isEditingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Tag Modal */}
      <Modal
        show={showTagModal}
        onHide={handleCloseTagModal}
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">
            {isEditingTag ? "Edit Tag" : "Create New Tag"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTagSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={tagForm.name}
                onChange={handleTagInputChange}
                required
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Slug (optional)</Form.Label>
              <Form.Control
                type="text"
                name="slug"
                value={tagForm.slug}
                onChange={handleTagInputChange}
                placeholder="Will be generated from name if left empty"
                className="bg-secondary text-light"
              />
            </Form.Group>

            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary"
                className="me-2"
                onClick={handleCloseTagModal}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {isEditingTag ? "Update Tag" : "Create Tag"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Image Upload Preview Modal */}
      <Modal
        show={showImageModal}
        onHide={handleCancelImageUpload}
        centered
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">Upload Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {imagePreview && (
            <div className="text-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="img-fluid mb-3"
                style={{ maxHeight: "300px" }}
              />
            </div>
          )}

          {uploadingImage && (
            <div className="mt-3">
              <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-dark">
          <Button
            variant="secondary"
            onClick={handleCancelImageUpload}
            disabled={uploadingImage}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImageUpload}
            disabled={uploadingImage || !imageFile}
          >
            {uploadingImage ? "Uploading..." : "Upload"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        show={showDeleteCategoryModal}
        onHide={() => setShowDeleteCategoryModal(false)}
        centered
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-light">
            Are you sure you want to delete the category "
            {categoryToDelete?.name}"?
          </p>
          <p className="text-danger">
            This action cannot be undone. Any articles using this category will
            be updated.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-dark">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteCategoryModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCategory}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Tag Confirmation Modal */}
      <Modal
        show={showDeleteTagModal}
        onHide={() => setShowDeleteTagModal(false)}
        centered
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-light">
            Are you sure you want to delete the tag "{tagToDelete?.name}"?
          </p>
          <p className="text-danger">
            This action cannot be undone. Any articles using this tag will be
            updated.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-dark">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteTagModal(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTag}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminBlogPage;
