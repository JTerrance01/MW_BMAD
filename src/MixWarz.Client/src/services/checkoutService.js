import axios from 'axios';

const API_BASE_URL = 'https://localhost:7001/api';

/**
 * Creates a Stripe checkout session for the provided cart items
 * @param {Array} cartItems - Array of cart items to checkout
 * @returns {Promise} Promise resolving to checkout session data
 */
export const createCheckoutSession = async (cartItems) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Get user ID from token (decode JWT to get user ID)
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenPayload.nameid || tokenPayload.sub || tokenPayload.id;

    // Format cart items to match backend DTOs with PascalCase properties
    const formattedCartItems = cartItems.map(item => ({
      ProductId: item.productId,
      ProductName: item.productName,
      ProductPrice: item.productPrice,
      ProductImageUrl: item.productImageUrl || '',
      Quantity: item.quantity,
      TotalPrice: item.productPrice * item.quantity
    }));

    // Create the command object expected by the backend
    const checkoutCommand = {
      CartItems: formattedCartItems,
      UserId: userId,
      SuccessUrl: `${window.location.origin}/checkout/success`,
      CancelUrl: `${window.location.origin}/checkout/cancel`
    };

    console.log('🛒 Sending checkout command:', checkoutCommand);

    const response = await axios.post(
      `${API_BASE_URL}/checkout/create-session`,
      checkoutCommand,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.error || error.response.data || 'Invalid checkout request');
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error('Failed to create checkout session. Please try again.');
    }
  }
};

/**
 * Redirects to Stripe checkout using the session ID
 * @param {string} sessionId - Stripe checkout session ID
 */
export const redirectToCheckout = async (sessionId) => {
  try {
    // Load Stripe.js
    const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
    
    if (!stripe) {
      throw new Error('Stripe.js failed to load');
    }

    // Redirect to Stripe checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
};

/**
 * Combined function to create session and redirect to checkout
 * @param {Array} cartItems - Array of cart items to checkout
 */
export const proceedToCheckout = async (cartItems) => {
  try {
    console.log('🛒 Starting checkout process with items:', cartItems);
    
    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Create checkout session
    const sessionData = await createCheckoutSession(cartItems);
    console.log('✅ Checkout session created:', sessionData.sessionId);

    // Redirect to Stripe checkout
    await redirectToCheckout(sessionData.sessionId);
    
  } catch (error) {
    console.error('❌ Checkout process failed:', error);
    throw error;
  }
};

export default {
  createCheckoutSession,
  redirectToCheckout,
  proceedToCheckout
}; 