# Stripe Configuration Guide - Fix for 400 Bad Request Errors

## Problem Analysis ❌

The 400 Bad Request errors are occurring because the Stripe Price IDs are not properly configured. The frontend is sending invalid price IDs (`price_producer_monthly`, `price_legend_monthly`) which are placeholder values, not real Stripe Price IDs.

## Solution Steps ✅

### Step 1: Create Stripe Products

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com/
2. **Navigate to Products**: Products → Add Product
3. **Create Producer Subscription**:
   - Name: "Producer Membership"
   - Description: "Monthly subscription for serious music creators"
   - Pricing: $19.99/month (recurring)
   - Currency: USD
   - **Copy the Price ID** (starts with `price_`)
4. **Create Legend Subscription**:
   - Name: "Legend Membership"
   - Description: "Premium monthly subscription with exclusive features"
   - Pricing: $39.99/month (recurring)
   - Currency: USD
   - **Copy the Price ID** (starts with `price_`)

### Step 2: Configure Frontend Environment Variables

Create or update `src/MixWarz.Client/.env` file:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
REACT_APP_STRIPE_PRODUCER_PRICE_ID=price_your_actual_producer_price_id_here
REACT_APP_STRIPE_LEGEND_PRICE_ID=price_your_actual_legend_price_id_here
```

### Step 3: Configure Backend Environment Variables

Update your backend `appsettings.json` or environment variables:

```json
{
  "Stripe": {
    "PublishableKey": "pk_test_your_actual_publishable_key_here",
    "SecretKey": "sk_test_your_actual_secret_key_here",
    "WebhookSecret": "whsec_your_webhook_secret_when_ready"
  }
}
```

### Step 4: Restart Development Servers

1. **Stop both frontend and backend servers**
2. **Restart the backend**: `dotnet run` in API directory
3. **Restart the frontend**: `npm start` in Client directory

## Verification ✅

After configuration, you should see:

### Console Logs

- ✅ No errors about missing Stripe configuration
- ✅ `🔄 Creating subscription checkout session for producer tier (Price ID: price_actual_id)`
- ✅ `✅ Subscription checkout session created: cs_test_session_id`

### Error Resolution

- ✅ No more 400 Bad Request errors
- ✅ Successful redirect to Stripe checkout page
- ✅ Proper subscription creation

## Enhanced Error Handling ✅

The subscription service now includes:

- **Configuration Validation**: Checks for missing environment variables on startup
- **Detailed Error Logging**: Logs request/response details for debugging
- **User-Friendly Messages**: Clear instructions for configuration issues
- **Fallback Handling**: Prevents crashes from missing configuration

## Testing Checklist ✅

1. **Environment Variables**: Check `.env` file has real Stripe Price IDs
2. **Console Output**: Verify no configuration errors on page load
3. **Button Click**: "Become A Producer" should show loading state
4. **Network Tab**: Check 200 response instead of 400
5. **Stripe Redirect**: Should redirect to Stripe checkout page

## Backend Configuration (if needed) 🔧

If you need to set up Stripe on the backend side, ensure:

1. **Stripe.NET Package**: Already installed (v48.2.0)
2. **Service Registration**: `IStripeService` already registered in DI
3. **API Keys**: Secret key configured for creating checkout sessions
4. **Database**: Subscriptions table exists (already created)

## Troubleshooting 🔍

### Still getting 400 errors?

1. **Check Price IDs**: Ensure they start with `price_` not `prod_`
2. **Verify Keys**: Test keys should start with `pk_test_` and `sk_test_`
3. **API Logs**: Check backend console for detailed error messages
4. **Network Tab**: Inspect request payload and response

### Authentication issues?

1. **User Login**: Ensure user is logged in before clicking subscription buttons
2. **JWT Token**: Check localStorage has valid token
3. **Role Permissions**: Verify user has appropriate permissions

## Next Steps After Configuration ✅

1. **Test Subscription Flow**: Complete a test subscription with Stripe test cards
2. **Webhook Setup**: Configure webhooks for production deployment
3. **User Testing**: Test both Producer and Legend subscription tiers
4. **Error Scenarios**: Test with expired cards, insufficient funds, etc.

---

**Status**: Configuration guide complete - follow steps above to resolve 400 errors and enable subscription functionality.
