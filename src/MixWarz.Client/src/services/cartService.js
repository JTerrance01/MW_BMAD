import apiService from "./apiService";

/**
 * Cart service with comprehensive error handling
 * Handles all shopping cart-related API operations
 */
const cartService = {
  /**
   * Get current user's cart
   * @returns {Promise<Object>} Cart data
   */
  getCart: async () => {
    return apiService.get(
      "/api/cart",
      {},
      {
        errorContext: "Get Cart",
      }
    );
  },

  /**
   * Add product to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  addToCart: async (productId, quantity = 1) => {
    return apiService.post(
      "/api/cart/add",
      { productId, quantity },
      {
        errorContext: "Add to Cart",
      }
    );
  },

  /**
   * Remove product from cart
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Updated cart
   */
  removeFromCart: async (productId) => {
    return apiService.post(
      "/api/cart/remove",
      { productId },
      {
        errorContext: "Remove from Cart",
      }
    );
  },

  /**
   * Update cart item quantity
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  updateCartItem: async (productId, quantity) => {
    return apiService.put(
      "/api/cart/update",
      { productId, quantity },
      {
        errorContext: "Update Cart Item",
      }
    );
  },

  /**
   * Clear cart (remove all items)
   * @returns {Promise<Object>} Empty cart
   */
  clearCart: async () => {
    return apiService.post(
      "/api/cart/clear",
      {},
      {
        errorContext: "Clear Cart",
      }
    );
  },

  /**
   * Apply coupon code to cart
   * @param {string} couponCode - Coupon code to apply
   * @returns {Promise<Object>} Updated cart with discount
   */
  applyCoupon: async (couponCode) => {
    return apiService.post(
      "/api/cart/coupon",
      { couponCode },
      {
        errorContext: "Apply Coupon",
      }
    );
  },

  /**
   * Remove coupon from cart
   * @returns {Promise<Object>} Updated cart without discount
   */
  removeCoupon: async () => {
    return apiService.delete("/api/cart/coupon", {
      errorContext: "Remove Coupon",
    });
  },

  /**
   * Get shipping options for cart
   * @param {Object} addressData - Address data for shipping calculation
   * @returns {Promise<Object>} Available shipping options
   */
  getShippingOptions: async (addressData) => {
    return apiService.post("/api/cart/shipping", addressData, {
      errorContext: "Get Shipping Options",
    });
  },

  /**
   * Calculate cart totals
   * @param {Object} params - Optional parameters (shipping method, etc.)
   * @returns {Promise<Object>} Cart totals
   */
  calculateTotals: async (params = {}) => {
    return apiService.get("/api/cart/totals", params, {
      errorContext: "Calculate Cart Totals",
    });
  },
};

export default cartService;
