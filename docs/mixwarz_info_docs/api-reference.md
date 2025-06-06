# MixWarz API Reference

This document outlines the external APIs consumed by MixWarz and the internal APIs it provides for its frontend client.

## External APIs Consumed

### Stripe API (Payment Processing)

-   **Purpose:** To process payments for e-commerce product purchases.
-   **Base URL(s):**
    -   Production: `https://api.stripe.com`
-   **Authentication:** API Key (Secret Key) sent in the `Authorization: Bearer <STRIPE_SECRET_KEY>` header for server-side calls. Publishable Key used by Stripe.js on the client. Reference `docs/environment-vars.md` for `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`.
-   **Key Endpoints Used (Server-Side by MixWarz Backend):**
    -   **`POST /v1/payment_intents`**:
        -   Description: Creates a new PaymentIntent to represent a transaction.
        -   Request Body Schema: (Includes `amount`, `currency`, `customer` (optional), `payment_method_types`, `metadata`)
        -   Example Request (Conceptual):
            ```json
            {
              "amount": 2000, // e.g., cents
              "currency": "usd",
              "payment_method_types": ["card"],
              "metadata": {
                "mixwarz_order_id_placeholder": "temp_order_123"
              }
            }
            ```
        -   Success Response Schema (Code: `200 OK`): (Includes `id`, `client_secret`, `status`)
    -   **Webhook Handling (Endpoint exposed by MixWarz: `POST /api/v1/webhooks/stripe`)**:
        -   Description: Stripe sends events (e.g., `payment_intent.succeeded`, `payment_intent.payment_failed`) to this MixWarz endpoint.
        -   Request Body Schema: Varies by event type (Stripe Event object). MixWarz must validate signatures.
-   **Client-Side Interaction (Stripe.js):**
    -   The frontend uses Stripe.js with the `client_secret` (obtained from MixWarz backend) and the Publishable Key to collect card details via Stripe Elements and confirm the payment.
-   **Rate Limits:** Standard Stripe rate limits apply (e.g., 100 read operations/sec, 100 write operations/sec in live mode).
-   **Link to Official Docs:** `https://stripe.com/docs/api`

### AWS S3 API (via AWS SDK)

-   **Purpose:** Store and retrieve user-uploaded mix submissions, digital product files, and product images.
-   **Authentication:** AWS IAM Roles for ECS Tasks (backend) and potentially pre-signed URLs for client-side uploads/downloads.
-   **Key Operations Used (via .NET AWS SDK or JS AWS SDK for pre-signed URLs):**
    -   `PutObject`: Upload files.
    -   `GetObject`: Retrieve files.
    -   `DeleteObject`: Delete files (less common for submissions/products, maybe for temp files).
    -   `GeneratePresignedUrl`: Create temporary, secure URLs for client-side uploads or downloads.
-   **Key Resource Identifiers:** Bucket names defined in `docs/environment-vars.md` (e.g., `S3_SUBMISSIONS_BUCKET_NAME`, `S3_PRODUCT_FILES_BUCKET_NAME`, `S3_PRODUCT_IMAGES_BUCKET_NAME`).
-   **Link to Official Docs:** `https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html`

### AWS SES API (via AWS SDK - Optional for MVP)

-   **Purpose:** Send transactional emails (e.g., registration confirmation, order confirmation).
-   **Authentication:** AWS IAM Roles for ECS Tasks.
-   **Key Operations Used (via .NET AWS SDK):**
    -   `SendEmail`: Sends a formatted email.
-   **Key Resource Identifiers:** Verified sender email addresses/domains.
-   **Link to Official Docs:** `https://docs.aws.amazon.com/ses/latest/APIReference/Welcome.html`

## Internal APIs Provided (MixWarz .NET Core Web API for Frontend)

-   **Purpose:** Provides all necessary data and functionality for the MixWarz React frontend.
-   **Base URL(s):** `/api/v1/` (e.g., `https://api.mixwarz.com/api/v1/` in production).
-   **Authentication/Authorization:** JWT Bearer tokens in `Authorization` header for protected routes. Role-Based Access Control (RBAC) for Admin/Organizer/User roles.
-   **Common Response Structure:**
    -   Success (2xx): JSON payload, specific to endpoint.
    -   Client Error (4xx): Standardized JSON error response:
        ```json
        {
          "type": "Validation Error / Not Found / Unauthorized / Forbidden", // ProblemDetails type
          "title": "One or more validation errors occurred.", // Or a more specific title
          "status": 400, // HTTP status code
          "traceId": "00-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-00", // Correlation ID
          "errors": { // Optional, for validation errors
            "fieldName": ["Error message 1", "Error message 2"]
          }
        }
        ```
    -   Server Error (5xx): Standardized JSON error response (less detail than 4xx to avoid exposing sensitive info):
        ```json
        {
          "title": "An unexpected error occurred.",
          "status": 500,
          "traceId": "00-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-00"
        }
        ```
-   **API Versioning:** Via URL (`/api/v1/`).

---
**Endpoints (High-Level Overview - Detailed in Epics & Swashbuckle/Swagger Output)**

*Refer to `epic1.md`, `epic2.md`, `epic3.md`, `epic4.md` for detailed user stories that map to these API endpoints. The backend will also generate a Swagger/OpenAPI specification using Swashbuckle.*

### Authentication (`/auth`)

-   **`POST /auth/register`**: User registration.
    -   Request: `RegisterUserDto` (username, email, password).
    -   Response: 200 OK (Success), 400 Bad Request (Validation, User Exists).
-   **`POST /auth/login`**: User login.
    -   Request: `LoginUserDto` (email, password).
    -   Response: 200 OK with `AuthResponseDto` (JWT token, refresh token), 400/401 Bad Request (Invalid credentials).
-   **`POST /auth/refresh-token`**: (Post-MVP, for token refresh)

### Users (`/users` or `/profile`) - Protected

-   **`GET /users/me`** or **`GET /profile`**: Get current authenticated user's profile.
    -   Response: `UserProfileDto`.

### Competitions (`/competitions`)

-   **`POST /competitions`**: Create new competition (Admin/Organizer).
    -   Request: `CreateCompetitionDto`.
    -   Response: 201 Created with `CompetitionDetailDto`, 400 Bad Request, 401/403.
-   **`GET /competitions`**: List public competitions (paginated, filter by status).
    -   Response: `PaginatedList<CompetitionSummaryDto>`.
-   **`GET /competitions/{competitionId}`**: Get competition details.
    -   Response: `CompetitionDetailDto`, 404 Not Found.
-   **`PUT /competitions/{competitionId}`**: Update competition (Admin/Organizer who owns it).
    -   Request: `UpdateCompetitionDto`.
    -   Response: 200 OK with `CompetitionDetailDto`, 400, 401/403, 404.
-   **`POST /competitions/{competitionId}/submissions`**: Submit to competition (User).
    -   Request: Multipart/form-data (`SubmitMixDto` + audio file).
    -   Response: 201 Created with `SubmissionDto`, 400, 401/403, 404.
-   **`GET /competitions/{competitionId}/submissions/manage`**: List submissions for an organizer/admin (Admin/Organizer).
    -   Response: `PaginatedList<SubmissionManagementDto>`.
-   **`GET /competitions/{competitionId}/results`**: Get public competition results/leaderboard.
    -   Response: `List<CompetitionResultDto>`.

### Submissions (`/submissions`) - Protected

-   **`PATCH /submissions/{submissionId}/judge`**: Score/feedback a submission (Admin/Organizer).
    -   Request: `JudgeSubmissionDto` (score, feedback).
    -   Response: 200 OK with `SubmissionDto`, 400, 401/403, 404.

### Products (`/products`)

-   **`POST /products`**: Add new product (Admin).
    -   Request: Multipart/form-data (`CreateProductDto` + image file + digital file).
    -   Response: 201 Created with `ProductDetailDto`, 400, 401/403.
-   **`GET /products`**: List active products (paginated, filter by category, search).
    -   Response: `PaginatedList<ProductSummaryDto>`.
-   **`GET /products/{productId}`**: Get product details.
    -   Response: `ProductDetailDto`, 404 Not Found.
-   **`PUT /products/{productId}`**: Update product (Admin).
    -   Request: Multipart/form-data (`UpdateProductDto` + optional files).
    -   Response: 200 OK with `ProductDetailDto`, 400, 401/403, 404.
-   **`GET /products/my-purchases`**: List products purchased by the current user (User).
    -   Response: `List<PurchasedProductDto>`.
-   **`GET /products/{productId}/download-link`**: Get secure download link for a purchased product (User).
    -   Response: `DownloadLinkDto` (pre-signed S3 URL), 401/403, 404.

### Categories (`/categories`)

-   **`GET /categories`**: List all product categories.
    -   Response: `List<CategoryDto>`.

### Cart (`/cart`) - Protected (User)

-   **`GET /cart`**: Get current user's cart.
    -   Response: `CartDto`.
-   **`POST /cart/items`**: Add item to cart.
    -   Request: `AddCartItemDto` (productId, quantity).
    -   Response: 200 OK with `CartDto`.
-   **`PUT /cart/items/{productId}`**: Update item quantity in cart.
    -   Request: `UpdateCartItemDto` (quantity).
    -   Response: 200 OK with `CartDto`.
-   **`DELETE /cart/items/{productId}`**: Remove item from cart.
    -   Response: 200 OK with `CartDto`.
-   **`POST /cart/merge`**: Merge client-side cart on login.
    -   Request: `List<ClientCartItemDto>`.
    -   Response: 200 OK with `CartDto`.

### Checkout (`/checkout`) - Protected (User)

-   **`POST /checkout/create-payment-intent`**: Create Stripe Payment Intent.
    -   Response: `PaymentIntentResponseDto` (clientSecret).

### Orders (`/orders`) - Protected (User)

-   **`GET /orders`**: List current user's order history (paginated).
    -   Response: `PaginatedList<OrderSummaryDto>`.

### Webhooks (`/webhooks`)

-   **`POST /webhooks/stripe`**: Stripe webhook handler.
    -   Request: Stripe Event object.
    -   Response: 200 OK (or appropriate error if signature validation fails).

### Admin (`/admin/*`) - Protected (Admin Role)

-   **`GET /admin/users`**: List all users (paginated, search).
    -   Response: `PaginatedList<AdminUserDto>`.
-   **`PUT /admin/users/{userId}/roles`**: Update user roles.
    -   Request: `UpdateUserRolesDto`.
    -   Response: 200 OK.
-   **`GET /admin/competitions/all`**: List all competitions (paginated, filter).
    -   Response: `PaginatedList<AdminCompetitionDto>`.
-   **`PATCH /admin/competitions/{competitionId}/status`**: Change competition status.
    -   Request: `UpdateCompetitionStatusDto`.
    -   Response: 200 OK.
-   **`GET /admin/products/all`**: List all products (paginated, filter).
    -   Response: `PaginatedList<AdminProductDto>`.
-   **`PATCH /admin/products/{productId}/toggle-active`**: Toggle product active status.
    -   Response: 200 OK.
-   **`GET /admin/orders/all`**: List all orders (paginated, filter).
    -   Response: `PaginatedList<AdminOrderSummaryDto>`.
-   **`GET /admin/orders/{orderId}`**: Get details for a specific order.
    -   Response: `AdminOrderDetailDto`.

---

## Change Log

| Change        | Date       | Version | Description                     | Author         |
| ------------- | ---------- | ------- | ------------------------------- | -------------- |
| Initial draft | 2025-05-07 | 0.1     | Initial API reference structure | Architect_2    |