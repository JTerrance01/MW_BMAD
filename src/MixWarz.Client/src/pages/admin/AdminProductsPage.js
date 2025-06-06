import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Pagination,
  Badge,
  Spinner,
  Alert,
  InputGroup,
  Tab,
  Tabs,
  Row,
  Col,
} from "react-bootstrap";
import {
  fetchAdminProducts,
  setPage,
  updateProductStatus,
  createProduct,
  updateProduct,
} from "../../store/adminSlice";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaImage,
  FaSync,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "./AdminStyles.css";

const AdminProductsPage = () => {
  const dispatch = useDispatch();
  const { products, loading, error, totalCount, currentPage, pageSize } =
    useSelector((state) => state.admin);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [categories, setCategories] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    fileUrl: "",
    isActive: true,
  });

  // Capture file uploads
  const [imageFile, setImageFile] = useState(null);
  const [productFile, setProductFile] = useState(null);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    loadProducts();
    // Fetch categories from API in a real implementation
    setCategories([
      { id: 1, name: "Samples" },
      { id: 2, name: "Presets" },
      { id: 3, name: "MIDI Packs" },
      { id: 4, name: "Project Files" },
    ]);
  }, [dispatch, currentPage, pageSize, filterCategory, activeTab]);

  const loadProducts = () => {
    // Prepare filter params
    const params = {
      page: currentPage,
      pageSize,
      searchTerm: searchTerm || undefined,
      categoryId: filterCategory || undefined,
      isActive:
        activeTab === "active"
          ? true
          : activeTab === "inactive"
          ? false
          : undefined,
    };

    dispatch(fetchAdminProducts(params));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setPage(1)); // Reset to first page on new search
    loadProducts();
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(setPage(1)); // Reset to first page on tab change
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddProduct = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      imageUrl: "",
      fileUrl: "",
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price?.toString() || "",
      categoryId: product.categoryId?.toString() || "",
      imageUrl: product.imageUrl || "",
      fileUrl: product.fileUrl || "",
      isActive: product.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateStatus = (productId, newStatus) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          newStatus ? "activate" : "deactivate"
        } this product?`
      )
    ) {
      dispatch(
        updateProductStatus({
          productId,
          isActive: newStatus,
        })
      ).then(() => {
        loadProducts();
      });
    }
  };

  const handleImageError = (productId) => {
    setImageErrors((prev) => ({
      ...prev,
      [productId]: true,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === "imageFile" && files.length > 0) {
      setImageFile(files[0]);
    } else if (name === "productFile" && files.length > 0) {
      setProductFile(files[0]);
    }
  };

  const handleSubmit = () => {
    if (showAddModal) {
      // Create new product
      const formDataObj = new FormData();

      // Add basic product data (using PascalCase for C# model binding)
      formDataObj.append("Name", formData.name);
      formDataObj.append("Description", formData.description);
      formDataObj.append("Price", parseFloat(formData.price));
      formDataObj.append("CategoryId", parseInt(formData.categoryId));
      formDataObj.append("ProductType", 0); // Default to SamplePack (0)

      // Handle file uploads (required for create)
      if (imageFile) {
        formDataObj.append("ImageFile", imageFile);
      }

      if (productFile) {
        formDataObj.append("DownloadFile", productFile);
      } else {
        // For create operation, download file is required
        alert("Please select a product file to upload.");
        return;
      }

      dispatch(createProduct(formDataObj))
        .unwrap()
        .then(() => {
          setShowAddModal(false);
          loadProducts();
          // Reset form and files
          resetForm();
        })
        .catch((error) => {
          console.error("Failed to create product:", error);
          alert(`Error creating product: ${error}`);
        });
    } else if (showEditModal && selectedProduct) {
      // Update existing product
      const formDataObj = new FormData();

      // Add product ID for update
      formDataObj.append("ProductId", selectedProduct.productId);

      // Add basic product data (using PascalCase for C# model binding)
      formDataObj.append("Name", formData.name);
      formDataObj.append("Description", formData.description);
      formDataObj.append("Price", parseFloat(formData.price));
      formDataObj.append("CategoryId", parseInt(formData.categoryId));
      formDataObj.append("ProductType", 0); // Default to SamplePack (0)
      formDataObj.append("IsActive", formData.isActive ? "true" : "false");

      // Handle file updates
      if (imageFile) {
        formDataObj.append("ImageFile", imageFile);
        formDataObj.append("UpdateImage", "true");
      } else {
        formDataObj.append("UpdateImage", "false");
      }

      if (productFile) {
        formDataObj.append("DownloadFile", productFile);
        formDataObj.append("UpdateDownloadFile", "true");
      } else {
        formDataObj.append("UpdateDownloadFile", "false");
      }

      console.log("Updating product with data:", {
        productId: selectedProduct.productId,
        name: formData.name,
        hasImageFile: !!imageFile,
        hasProductFile: !!productFile
      });

      dispatch(updateProduct({ 
        productId: selectedProduct.productId, 
        productData: formDataObj 
      }))
        .unwrap()
        .then((result) => {
          console.log("Product updated successfully:", result);
          setShowEditModal(false);
          loadProducts(); // Refresh the products list
          resetForm();
        })
        .catch((error) => {
          console.error("Failed to update product:", error);
          alert(`Error updating product: ${error}`);
        });
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setImageFile(null);
    setProductFile(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      imageUrl: "",
      fileUrl: "",
      isActive: true,
    });
  };

  // Generate pagination items
  const paginationItems = [];
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

  return (
    <div className="admin-content">
      <h1 className="mb-4">Product Management</h1>
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <Card className="mb-4 bg-dark text-light">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4 actions-bar">
            <Form
              onSubmit={handleSearch}
              className="d-flex"
              style={{ width: "300px" }}
            >
              <InputGroup>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-dark text-light border-secondary"
                />
                <Button variant="primary" type="submit">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            <div className="d-flex">
              <Form.Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="me-2 bg-dark text-light border-secondary"
                style={{ width: "150px" }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>

              <Button
                variant="secondary"
                onClick={loadProducts}
                className="me-2"
                title="Refresh Products List"
              >
                <FaSync />
              </Button>

              <Button
                variant="primary"
                onClick={handleAddProduct}
                className="d-flex align-items-center"
              >
                <FaPlus className="me-1" /> New Product
              </Button>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4 product-tabs"
          >
            <Tab eventKey="active" title="Active Products" />
            <Tab eventKey="inactive" title="Inactive Products" />
            <Tab eventKey="all" title="All Products" />
          </Tabs>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" className="mb-2">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p>Loading products...</p>
            </div>
          ) : (
            renderProductsTable()
          )}

          <div className="d-flex justify-content-between align-items-center mt-4">
            <p className="mb-0 text-light">
              {totalCount > 0
                ? `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(
                    currentPage * pageSize,
                    totalCount
                  )} of ${totalCount} products`
                : "No products found"}
            </p>
            {totalPages > 1 && (
              <Pagination className="mb-0 pagination-dark">
                {paginationItems}
              </Pagination>
            )}
          </div>
        </Card.Body>
      </Card>
      {/* Add Product Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        centered
        backdrop="static"
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="text-primary">Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="product-form">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="29.99"
                    min="0"
                    step="0.01"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Category</Form.Label>
                  <Form.Select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="bg-dark text-light border-secondary"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="bg-dark text-light border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Enter a URL for the product image or upload below
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">File URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="fileUrl"
                    value={formData.fileUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/file.zip"
                    className="bg-dark text-light border-secondary code-input"
                  />
                  <Form.Text className="text-muted">
                    Enter a URL for the downloadable file or upload below
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Upload Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    name="imageFile"
                    onChange={handleFileChange}
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Upload Product File
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept=".zip,.rar,.7z,.wav,.mp3,.aif"
                    name="productFile"
                    onChange={handleFileChange}
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active Product (will be visible in the store)"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="text-light"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button
            variant="secondary"
            onClick={() => setShowAddModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" />
                Processing...
              </>
            ) : (
              "Add Product"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Edit Product Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
        backdrop="static"
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title className="text-primary">Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="product-form">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="29.99"
                    min="0"
                    step="0.01"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Category</Form.Label>
                  <Form.Select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="bg-dark text-light border-secondary"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-light">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                className="bg-dark text-light border-secondary"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">File URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="fileUrl"
                    value={formData.fileUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/file.zip"
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Upload Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    name="imageFile"
                    onChange={handleFileChange}
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">
                    Upload Product File
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept=".zip,.rar,.7z,.wav,.mp3,.aif"
                    name="productFile"
                    onChange={handleFileChange}
                    className="bg-dark text-light border-secondary"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active Product (will be visible in the store)"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="text-light"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" />
                Processing...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  function renderProductsTable() {
    if (products.length === 0) {
      return (
        <div className="text-center py-5">
          <p className="mb-3 text-light">No products found</p>
          <Button variant="primary" onClick={handleAddProduct}>
            <FaPlus className="me-1" /> Add Your First Product
          </Button>
        </div>
      );
    }

    return (
      <Table responsive hover variant="dark" className="text-light">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th width="150">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="d-flex align-items-center">
                  {product.imageUrl && !imageErrors[product.id] ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      width="40"
                      height="40"
                      className="rounded me-2"
                      style={{ objectFit: "cover" }}
                      onError={() => handleImageError(product.id)}
                    />
                  ) : (
                    <div
                      className="bg-secondary bg-opacity-25 rounded me-2 d-flex align-items-center justify-content-center"
                      style={{ width: 40, height: 40 }}
                    >
                      <FaImage size={16} className="text-light" />
                    </div>
                  )}
                  <div>
                    <div className="fw-semibold text-light">{product.name}</div>
                    <small className="text-muted">ID: {product.id}</small>
                  </div>
                </div>
              </td>
              <td>
                {product.categoryName ? (
                  <Badge bg="info" text="dark">
                    {product.categoryName}
                  </Badge>
                ) : (
                  <Badge bg="secondary">Uncategorized</Badge>
                )}
              </td>
              <td className="text-light">
                ${product.price?.toFixed(2) || "N/A"}
              </td>
              <td>
                {product.isActive ? (
                  <Badge bg="success">Active</Badge>
                ) : (
                  <Badge bg="secondary">Inactive</Badge>
                )}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                    title="Edit"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant={
                      product.isActive ? "outline-danger" : "outline-success"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(product.id, !product.isActive)
                    }
                    title={product.isActive ? "Deactivate" : "Activate"}
                  >
                    {product.isActive ? <FaToggleOff /> : <FaToggleOn />}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }
};

export default AdminProductsPage;
