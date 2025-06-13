import axios from 'axios';

const API_BASE_URL = 'https://localhost:7001/api';

// Stripe Price IDs for membership tiers
const SUBSCRIPTION_PRICE_IDS = {
  producer: process.env.REACT_APP_STRIPE_PRODUCER_PRICE_ID,
  legend: process.env.REACT_APP_STRIPE_LEGEND_PRICE_ID
};

// Validate Stripe configuration on import
const validateStripeConfig = () => {
  const missingKeys = [];
  
  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    missingKeys.push('REACT_APP_STRIPE_PUBLISHABLE_KEY');
  }
  
  if (!SUBSCRIPTION_PRICE_IDS.producer) {
    missingKeys.push('REACT_APP_STRIPE_PRODUCER_PRICE_ID');
  }
  
  if (!SUBSCRIPTION_PRICE_IDS.legend) {
    missingKeys.push('REACT_APP_STRIPE_LEGEND_PRICE_ID');
  }

  if (missingKeys.length > 0) {
    console.error('❌ Missing Stripe configuration environment variables:', missingKeys);
    console.error(`
🔧 Configuration Required:

Please add the following environment variables to your .env file:

REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_STRIPE_PRODUCER_PRICE_ID=price_your_producer_price_id  
REACT_APP_STRIPE_LEGEND_PRICE_ID=price_your_legend_price_id

Instructions:
1. Log into your Stripe Dashboard
2. Create "Producer" and "Legend" subscription products
3. Configure monthly recurring prices ($19.99 and $39.99)
4. Copy the Price IDs to your environment variables
5. Restart your development server
    `);
  }
  
  return missingKeys.length === 0;
};

// Validate configuration on module load
const isConfigValid = validateStripeConfig();

/**
 * Creates a Stripe subscription checkout session
 * @param {string} subscriptionType - "producer" or "legend"
 * @returns {Promise} Promise resolving to subscription checkout session data
 */
export const createSubscriptionCheckoutSession = async (subscriptionType) => {
  try {
    // Validate Stripe configuration before proceeding
    if (!isConfigValid) {
      throw new Error('Stripe configuration is incomplete. Please check console for configuration instructions.');
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const priceId = SUBSCRIPTION_PRICE_IDS[subscriptionType];
    if (!priceId) {
      throw new Error(`Missing Stripe Price ID for subscription type: ${subscriptionType}. Please configure REACT_APP_STRIPE_${subscriptionType.toUpperCase()}_PRICE_ID environment variable.`);
    }

    console.log(`🔄 Creating subscription checkout session for ${subscriptionType} tier (Price ID: ${priceId})`);

    const response = await axios.post(
      `${API_BASE_URL}/checkout/create-subscription-session`,
      {
        priceId: priceId,
        subscriptionType: subscriptionType
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Error creating subscription checkout session:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    } else if (error.response?.status === 409) {
      // User already has subscription
      throw new Error(error.response.data?.error || 'You already have an active subscription.');
    } else if (error.response?.status === 400) {
      const errorMessage = error.response.data?.error || 'Invalid subscription request';
      console.error('❌ 400 Error Details:', {
        url: error.config?.url,
        data: error.config?.data,
        responseData: error.response?.data
      });
      throw new Error(errorMessage);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to create subscription checkout session. Please try again.');
    }
  }
};

/**
 * Redirects to Stripe checkout using the session ID
 * @param {string} sessionId - Stripe checkout session ID
 */
export const redirectToSubscriptionCheckout = async (sessionId) => {
  try {
    const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key is not configured. Please set REACT_APP_STRIPE_PUBLISHABLE_KEY environment variable.');
    }

    // Load Stripe.js
    const stripe = window.Stripe(publishableKey);
    
    if (!stripe) {
      throw new Error('Stripe.js failed to load. Please check your internet connection and Stripe configuration.');
    }

    console.log('🔄 Redirecting to Stripe checkout...');

    // Redirect to Stripe checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('❌ Error redirecting to subscription checkout:', error);
    throw error;
  }
};

/**
 * Combined function to create subscription session and redirect to checkout
 * @param {string} subscriptionType - "producer" or "legend"
 */
export const proceedToSubscriptionCheckout = async (subscriptionType) => {
  try {
    console.log(`🚀 Starting subscription checkout for ${subscriptionType} tier`);
    
    // Create subscription checkout session
    const sessionData = await createSubscriptionCheckoutSession(subscriptionType);
    console.log('✅ Subscription checkout session created:', sessionData.sessionId);

    // Redirect to Stripe checkout
    await redirectToSubscriptionCheckout(sessionData.sessionId);
    
  } catch (error) {
    console.error('❌ Subscription checkout process failed:', error);
    throw error;
  }
};

export default {
  createSubscriptionCheckoutSession,
  redirectToSubscriptionCheckout,
  proceedToSubscriptionCheckout,
  SUBSCRIPTION_PRICE_IDS,
  isConfigValid
}; 