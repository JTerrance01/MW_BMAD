# Epic 7: Payment Gateway Integration & Subscription Management Automation (Stripe)

**Goal:** Integrate the Stripe payment gateway to handle payments for one-time purchases (e.g., multitracks) and recurring subscriptions. Automate user access to products based on real-time payment and subscription statuses managed via Stripe webhooks.

**Key Technologies:** Stripe .NET SDK, ASP.NET Core API, EF Core.

**Affected Modules/Entities:**
- `MixWarz.Domain/Entities/Product.cs`
- `MixWarz.Domain/Entities/Order.cs`
- `MixWarz.Domain/Entities/OrderItem.cs`
- `MixWarz.Domain/Entities/UserProductAccess.cs`
- `MixWarz.Domain/Entities/User.cs` (potentially for Stripe Customer ID)
- `MixWarz.API/Controllers/CartController.cs` (or new `CheckoutController.cs`)
- `MixWarz.API/Controllers/StripeWebhookController.cs` (new)
- `MixWarz.Application` (new Commands/Handlers for Stripe events, new Service interfaces)
- `MixWarz.Infrastructure` (implementations for Stripe services, new DB context entities/fields if a separate `Subscription` entity is made)

---

## User Stories for Epic 7

---

### Story 7.1: Setup Stripe SDK and Core Configuration

**As a** developer,
**I want to** integrate the Stripe .NET SDK into the project and configure necessary API keys and settings,
**So that** the application can securely communicate with the Stripe API for payment processing.

**Acceptance Criteria:**

1.  The `Stripe.net` NuGet package is added to `MixWarz.Infrastructure` and `MixWarz.API` (if directly used) projects.
2.  Configuration for Stripe (PublishableKey, SecretKey, WebhookSecret) is added to `appsettings.json` and accessible via `IConfiguration`.
    * Example structure in `appsettings.json`:
        ```json
        "Stripe": {
          "PublishableKey": "pk_test_YOUR_PUBLISHABLE_KEY",
          "SecretKey": "sk_test_YOUR_SECRET_KEY",
          "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET"
        }
        ```
3.  A basic service or utility class (e.g., `StripeService.cs` in `MixWarz.Infrastructure/Services`) can be initialized with the Stripe Secret Key.
4.  Stripe API version is pinned or noted (e.g., by setting `StripeConfiguration.ApiKey = "sk_test_..."; StripeConfiguration.ApiVersion = "2022-11-15";` or similar during setup).

**Technical Notes:**

* Ensure API keys and webhook secrets are stored securely, preferably using environment variables or Azure Key Vault/AWS Secrets Manager in production. For development, `appsettings.Development.json` and user secrets are acceptable.
* Register Stripe-related services in `MixWarz.Infrastructure/Extensions/ServiceCollectionExtensions.cs` or directly in `MixWarz.API/Program.cs`.

---

### Story 7.2: Modify `Product` Entity for Stripe Integration

**As an** administrator,
**I want to** associate MixWarz products with their corresponding Stripe Product and Price IDs,
**So that** the system can accurately initiate payments for the correct items in Stripe.

**Acceptance Criteria:**

1.  The `MixWarz.Domain/Entities/Product.cs` entity is updated to include:
    * `public string? StripeProductId { get; set; }`
    * `public string? StripePriceId { get; set; }`
2.  EF Core migrations are created and applied to update the database schema.
3.  The `MixWarz.Application/Features/Admin/Commands/CreateProduct/CreateProductCommand.cs` and its handler are updated to include `StripeProductId` and `StripePriceId` fields.
4.  The `MixWarz.Application/Features/Products/Commands/UpdateProduct/UpdateProductCommand.cs` (if it exists, or create one based on admin needs) and handler are updated to allow editing these Stripe IDs.
5.  (Optional - Manual Step/Admin UI) Existing products in the database can be updated with their corresponding Stripe IDs. If an admin UI exists, it should allow managing these fields.

**Technical Notes:**

* `StripeProductId` refers to the ID of a Product object in Stripe.
* `StripePriceId` refers to the ID of a Price object associated with that Product in Stripe. A single Stripe Product can have multiple Prices (e.g., different currencies, recurring vs. one-time). Ensure your model accommodates this if necessary, though for simplicity one `StripePriceId` per MixWarz `Product` is assumed here.
* These IDs are created manually in the Stripe Dashboard first.

---

### Story 7.3: Create Stripe Checkout Session for Purchases

**As a** user,
**I want to** initiate a payment for products in my cart (or a single product) through Stripe Checkout,
**So that** I can securely complete my purchase.

**Acceptance Criteria:**

1.  A new API endpoint is created (e.g., `POST /api/checkout/create-session` in a new `CheckoutController.cs` or existing `CartController.cs`).
2.  The endpoint accepts a list of product IDs and quantities (or uses the user's current cart).
3.  An `Order` entity is created in the MixWarz database with `OrderStatus.PendingPayment` and associated `OrderItem`s. The `OrderId` and `UserId` are recorded.
4.  The endpoint calls the Stripe API (`SessionService.CreateAsync`) to create a Stripe Checkout Session.
    * `LineItems` should be populated using `StripePriceId` from the `Product` entities and quantities.
    * `Mode` should be `payment` for one-time purchases or `subscription` if any item is a subscription.
    * `SuccessUrl` and `CancelUrl` (client-side URLs for Stripe to redirect to) are provided.
    * `ClientReferenceId` can be set to your internal `UserId` or `OrderId` for easier reconciliation (though metadata is more flexible).
    * `Metadata` should include your internal `OrderId` and `UserId` (e.g., `Metadata = new Dictionary<string, string> { { "MixWarzOrderId", order.Id.ToString() }, { "MixWarzUserId", userId } }`).
5.  The API endpoint returns the `Id` of the Stripe Checkout Session to the client.
6.  The client-side application will use this Session ID to redirect the user to Stripe Checkout.

**Technical Notes:**

* Use the `Stripe.Checkout.SessionCreateOptions` object.
* Ensure proper error handling if Stripe API calls fail.
* The `CartController.cs` in `MixWarz.API` and `CartRepository.cs` in `MixWarz.Infrastructure` will be relevant for fetching cart items.
* This story focuses on the backend. Client-side redirection to Stripe is a separate concern.

---

### Story 7.4: Implement Stripe Webhook Endpoint

**As a** system,
**I want to** provide a secure endpoint for Stripe to send webhook events,
**So that** I can receive real-time notifications about payment statuses and other relevant events.

**Acceptance Criteria:**

1.  A new controller `StripeWebhookController.cs` is created in `MixWarz.API`.
2.  A `POST` endpoint (e.g., `/api/webhooks/stripe`) is defined within this controller.
3.  The endpoint reads the raw JSON payload from the request body.
4.  The endpoint retrieves the `Stripe-Signature` header from the request.
5.  The endpoint uses `Stripe.EventUtility.ConstructEvent()` with the JSON payload, signature header, and the configured `WebhookSecret` to verify the event's authenticity and construct a `Stripe.Event` object.
6.  If signature verification fails, the endpoint returns an HTTP `400 Bad Request`.
7.  If successful, the endpoint logs the received event type (e.g., `stripeEvent.Type`).

**Technical Notes:**

* This endpoint must be publicly accessible for Stripe to reach it.
* The `WebhookSecret` is crucial for security.
* This story sets up the receiver; processing specific events will be handled in subsequent stories.
* Return `200 OK` quickly to Stripe once the event is received and verified, even if processing is offloaded.

---

### Story 7.5: Handle `checkout.session.completed` Webhook Event

**As a** system,
**I want to** process the `checkout.session.completed` Stripe webhook event,
**So that** I can update order statuses, grant product access, and manage subscription details upon successful initial payment.

**Acceptance Criteria:**

1.  Within `StripeWebhookController`, when `stripeEvent.Type == Stripe.Events.CheckoutSessionCompleted`:
    * Deserialize `stripeEvent.Data.Object` to a `Stripe.Checkout.Session` object.
    * Retrieve `MixWarzOrderId` and `MixWarzUserId` from `checkoutSession.Metadata`.
2.  If `checkoutSession.PaymentStatus == "paid"` and `MixWarzOrderId` is valid:
    * Locate the `Order` in the database using `MixWarzOrderId`.
    * Update the `Order.Status` to `OrderStatus.Paid`.
    * Update `Order.PaymentIntentId` (or a similar field) with `checkoutSession.PaymentIntentId` or `checkoutSession.SetupIntentId`.
    * For each line item in the original order (or by retrieving `checkoutSession.ListLineItems()` if necessary):
        * Identify the corresponding MixWarz `Product`.
        * Create a `UserProductAccess` record for the `MixWarzUserId` and `ProductId`.
            * Set `AccessGrantedDate` to `DateTime.UtcNow`.
            * If the product is a one-time purchase, `AccessExpiresDate` can be null or a far future date.
            * If the product is a subscription (`checkoutSession.Mode == "subscription"`), store `checkoutSession.SubscriptionId` and `checkoutSession.CustomerId` (e.g., on the `User` entity or a new `UserSubscription` entity/table linked to `UserProductAccess`). The `AccessExpiresDate` will be managed by `customer.subscription.updated` events.
    * Save changes to the database via `IAppDbContext`.
3.  (Optional but Recommended) Enqueue an email notification to the user confirming their order.
4.  The webhook handler returns HTTP `200 OK` to Stripe.

**Technical Notes:**

* Consider creating a dedicated service or MediatR command/handler (e.g., `ProcessCheckoutSessionCompletedCommand`) to encapsulate this logic, called from the webhook controller.
* Mapping Stripe Price IDs from line items back to your internal `ProductId` might be needed if not directly available in metadata.
* Add `StripeCustomerId` and `StripeSubscriptionId` fields to `User.cs` or `UserProductAccess.cs` or create a new `Subscription.cs` entity if not already present. Update EF Core migrations accordingly.
* The `Order.cs` entity should have a field like `StripePaymentIntentId` or `StripeCheckoutSessionId`.

---

### Story 7.6: Handle `invoice.payment_succeeded` Webhook Event (Recurring Subscriptions)

**As a** system,
**I want to** process the `invoice.payment_succeeded` Stripe webhook event,
**So that** I can confirm successful recurring subscription payments and update access periods.

**Acceptance Criteria:**

1.  Within `StripeWebhookController`, when `stripeEvent.Type == Stripe.Events.InvoicePaymentSucceeded`:
    * Deserialize `stripeEvent.Data.Object` to a `Stripe.Invoice` object.
2.  If `invoice.Paid == true` and `invoice.SubscriptionId` is present:
    * Retrieve the `Stripe.Subscription` object using `invoice.SubscriptionId` (either from the invoice object if it's expanded, or by fetching it from Stripe API).
    * Find the `UserProductAccess` record (or `Subscription` record) associated with this `StripeSubscriptionId`.
    * Update its `AccessExpiresDate` based on the subscription's `CurrentPeriodEnd` (from the Stripe Subscription object).
    * Ensure the user's access status remains active.
    * Save changes to the database.
3.  (Optional) Enqueue a subscription renewal confirmation email to the user.
4.  The webhook handler returns HTTP `200 OK` to Stripe.

**Technical Notes:**

* This event is crucial for continued access for active subscriptions.
* The `invoice` object contains `billing_reason` which can be `subscription_cycle`, `subscription_create`, etc. You primarily care about `subscription_cycle` here for renewals.
* The `UserProductAccess.AccessExpiresDate` (or equivalent on a `Subscription` entity) should reflect the end of the current paid period.

---

### Story 7.7: Handle `invoice.payment_failed` Webhook Event

**As a** system,
**I want to** process the `invoice.payment_failed` Stripe webhook event,
**So that** I can notify users of payment issues and potentially mark subscriptions as past due.

**Acceptance Criteria:**

1.  Within `StripeWebhookController`, when `stripeEvent.Type == Stripe.Events.InvoicePaymentFailed`:
    * Deserialize `stripeEvent.Data.Object` to a `Stripe.Invoice` object.
2.  If `invoice.SubscriptionId` is present:
    * Find the `UserProductAccess` record (or `Subscription` record) associated with this `StripeSubscriptionId`.
    * Optionally, update a status field on your subscription record to indicate `PastDue` or `PaymentFailed`. (Stripe manages dunning internally, so your system might just react to the final `customer.subscription.updated` or `deleted` event after dunning fails).
3.  Enqueue an email notification to the user about the failed payment, prompting them to update their payment method in Stripe (Stripe may also send its own dunning emails).
4.  The webhook handler returns HTTP `200 OK` to Stripe.

**Technical Notes:**

* Stripe usually attempts retries (dunning). This event is an early notification. Access revocation typically happens after dunning fails and the subscription is formally updated to an unpaid or canceled state by Stripe (see Story 7.8).

---

### Story 7.8: Handle `customer.subscription.updated` Webhook Event

**As a** system,
**I want to** process the `customer.subscription.updated` Stripe webhook event,
**So that** I can react to changes in subscription status (e.g., cancellations, pauses, trial endings, dunning failures leading to `unpaid` or `past_due` status) and update user access accordingly.

**Acceptance Criteria:**

1.  Within `StripeWebhookController`, when `stripeEvent.Type == Stripe.Events.CustomerSubscriptionUpdated`:
    * Deserialize `stripeEvent.Data.Object` to a `Stripe.Subscription` object.
2.  Find the `UserProductAccess` record (or your internal `Subscription` record) using `stripeSubscription.Id`.
3.  Update your internal subscription record fields based on the `stripeSubscription` object:
    * `Status` (e.g., map `stripeSubscription.Status` which can be `active`, `past_due`, `unpaid`, `canceled`, `incomplete`, `incomplete_expired`, `trialing`).
    * `CurrentPeriodStart` and `CurrentPeriodEnd`.
    * `CancelAtPeriodEnd` (boolean).
4.  If `stripeSubscription.Status` is `canceled`, `unpaid`, or `incomplete_expired` (and potentially `past_due` after a grace period you define):
    * Update `UserProductAccess.AccessExpiresDate` to `stripeSubscription.CanceledAt` or `CurrentPeriodEnd` if appropriate, or effectively revoke access immediately if payment is overdue.
    * Logic should ensure access is revoked if `CurrentPeriodEnd` is in the past and status is not `active` or `trialing`.
5.  If status changes (e.g., from `trialing` to `active`, or `active` to `canceled`), (Optional) send relevant email notifications.
6.  Save changes to the database.
7.  The webhook handler returns HTTP `200 OK` to Stripe.

**Technical Notes:**

* This is a critical event for managing the lifecycle of a subscription.
* The `Stripe.Subscription.Status` field is key.
* Ensure your logic correctly handles transitions between states and updates `UserProductAccess` to grant/revoke access.

---

### Story 7.9: Handle `customer.subscription.deleted` Webhook Event

**As a** system,
**I want to** process the `customer.subscription.deleted` Stripe webhook event,
**So that** I can definitively mark a subscription as canceled and revoke user access.

**Acceptance Criteria:**

1.  Within `StripeWebhookController`, when `stripeEvent.Type == Stripe.Events.CustomerSubscriptionDeleted`:
    * Deserialize `stripeEvent.Data.Object` to a `Stripe.Subscription` object (this represents the subscription as it was *before* deletion, but the `status` might be `canceled`).
2.  Find the `UserProductAccess` record (or your internal `Subscription` record) using `stripeSubscription.Id`.
3.  Mark the internal subscription record as definitively canceled.
4.  Immediately revoke access by setting `UserProductAccess.AccessExpiresDate` to a past date or by deleting the `UserProductAccess` record (if appropriate for your model).
5.  (Optional) Send a final subscription cancellation confirmation email.
6.  Save changes to the database.
7.  The webhook handler returns HTTP `200 OK` to Stripe.

**Technical Notes:**

* This event signifies the end of a subscription that won't be renewed.

---

### Story 7.10: Implement Basic Email Service for Notifications (Optional but Recommended)

**As a** system,
**I want to** send transactional emails for payment and subscription events,
**So that** users are kept informed about their account and purchases.

**Acceptance Criteria:**

1.  Define an `IEmailService` interface in `MixWarz.Application/Common/Interfaces` (e.g., `Task SendEmailAsync(string to, string subject, string bodyHtml, string bodyText)`).
2.  Implement `EmailService.cs` in `MixWarz.Infrastructure/Services` using a provider like SendGrid, AWS SES, or even .NET's SmtpClient (for basic needs, though less robust for production).
    * Configuration for the email provider (API key, sender address) should be in `appsettings.json`.
3.  Register `IEmailService` in DI.
4.  Integrate email sending into relevant webhook handlers (7.5, 7.6, 7.7, 7.8, 7.9) for events like:
    * Order confirmation.
    * Subscription renewal success.
    * Payment failure.
    * Subscription cancellation.
5.  Email templates can be simple strings for now, or use a templating engine.

**Technical Notes:**

* This makes the user experience much better.
* Focus on transactional emails triggered by the system, not marketing emails.

---

### Story 7.11: Secure Product Downloads based on `UserProductAccess`

**As a** user with a valid purchase/subscription,
**I want to** be able to download the products I have access to,
**And as a** system,
**I want to** prevent unauthorized downloads of protected products.

**Acceptance Criteria:**

1.  The `MixWarz.Application/Features/Products/Queries/GetProductDownloadUrl/GetProductDownloadUrlQueryHandler.cs` is modified.
2.  Before generating a download URL for a `Product`:
    * It checks if the `Product` requires payment/subscription (e.g., based on `Product.Price > 0` or a specific flag/type).
    * If it requires payment, it queries the `UserProductAccess` table for an active, non-expired record for the current `UserId` and the `ProductId`.
3.  If a valid `UserProductAccess` record exists (access granted and not expired), the handler proceeds to generate and return the S3 pre-signed URL as before.
4.  If no valid `UserProductAccess` record exists for a protected product, the handler throws an `UnauthorizedAccessException` or returns an appropriate error response (e.g., 403 Forbidden).
5.  Publicly accessible products (e.g., free samples) can still be downloaded without this check.

**Technical Notes:**

* This ensures that the `UserProductAccess` table, updated by Stripe webhooks, correctly controls access to paid content.
* The `UserId` needs to be available in the `GetProductDownloadUrlQueryHandler` (likely from HTTP context or claims principal).
* The logic should check `AccessExpiresDate` on `UserProductAccess` records.