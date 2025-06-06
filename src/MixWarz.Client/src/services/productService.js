import apiService from "./apiService";

/**
 * Product service with comprehensive error handling
 * Handles all product-related API operations
 */
const productService = {
  /**
   * Get list of products with optional filtering
   * @param {Object} params - Query parameters (category, sort, page, etc.)
   * @returns {Promise<Object>} List of products
   */
  getProducts: async (params = {}) => {
    return apiService.get("/api/products", params, {
      errorContext: "Product List",
    });
  },

  /**
   * Get product details by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product details
   */
  getProductById: async (id) => {
    return apiService.get(
      `/api/products/${id}`,
      {},
      {
        errorContext: `Product Details (${id})`,
      }
    );
  },

  /**
   * Get product categories
   * @returns {Promise<Object>} List of product categories
   */
  getCategories: async () => {
    return apiService.get(
      "/api/products/categories",
      {},
      {
        errorContext: "Product Categories",
      }
    );
  },

  /**
   * Create a new product (for admins/sellers)
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  createProduct: async (productData) => {
    return apiService.post("/api/products", productData, {
      errorContext: "Product Creation",
    });
  },

  /**
   * Update product details (for admins/sellers)
   * @param {string} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product
   */
  updateProduct: async (id, productData) => {
    return apiService.put(`/api/products/${id}`, productData, {
      errorContext: `Product Update (${id})`,
    });
  },

  /**
   * Upload product file (audio sample, preset, etc.)
   * @param {string} productId - Product ID
   * @param {File} file - File to upload
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  uploadProductFile: async (productId, file, metadata = {}, onProgress) => {
    return apiService.uploadFile(
      `/api/products/${productId}/file`,
      file,
      metadata,
      {
        errorContext: "Product File Upload",
        onProgress,
      }
    );
  },

  /**
   * Upload product image
   * @param {string} productId - Product ID
   * @param {File} imageFile - Image file to upload
   * @param {Object} metadata - Additional metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result with image URL
   */
  uploadProductImage: async (
    productId,
    imageFile,
    metadata = {},
    onProgress
  ) => {
    return apiService.uploadFile(
      `/api/products/${productId}/image`,
      imageFile,
      metadata,
      {
        errorContext: "Product Image Upload",
        onProgress,
      }
    );
  },

  /**
   * Get download URL for a purchased product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Download URL data
   */
  getProductDownloadUrl: async (productId) => {
    return apiService.get(
      `/api/products/${productId}/download`,
      {},
      {
        errorContext: `Product Download (${productId})`,
      }
    );
  },

  /**
   * Get product reviews
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Product reviews
   */
  getProductReviews: async (productId, params = {}) => {
    return apiService.get(`/api/products/${productId}/reviews`, params, {
      errorContext: `Product Reviews (${productId})`,
    });
  },

  /**
   * Submit a product review
   * @param {string} productId - Product ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Review result
   */
  submitReview: async (productId, reviewData) => {
    return apiService.post(`/api/products/${productId}/reviews`, reviewData, {
      errorContext: `Submit Review (${productId})`,
    });
  },

  /**
   * Update product status (for admins)
   * @param {string} productId - Product ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  updateProductStatus: async (productId, status) => {
    return apiService.put(
      `/api/admin/products/${productId}/status`,
      { status },
      {
        errorContext: `Update Product Status (${productId})`,
      }
    );
  },
};

export default productService;
