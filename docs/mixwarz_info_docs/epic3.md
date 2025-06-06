# Epic 3: E-commerce Module MVP

**Goal:** Develop the core functionalities for a digital product marketplace, enabling administrators to manage a basic catalog of digital products, and users to browse, purchase, and access these products. This epic directly supports the PRD objective of providing a curated e-commerce marketplace.

## Story List

### Story 3.1: E-commerce Entities & DB Migrations

-   **User Story / Goal:** As a Backend Developer, I want to define `Product`, `Category`, `Order`, `OrderItem`, `Cart`, and `CartItem` entities for the e-commerce module and create EF Core migrations, so that product and order data can be persistently stored.
-   **Detailed Requirements:**
    -   Define `Product` entity:
        -   Attributes: ProductID (PK), Name (string, required), Description (text, required), Price (decimal, required, >0), ProductType (enum: e.g., SamplePack, PresetBank, ProjectTemplate, Tutorial; required - focusing on digital for MVP), ImagePath (string, S3 key or URL, optional), DownloadFileS3Key (string, S3 key for digital product, required for digital), IsActive (bool, default true), CreationDate (DateTime, auto-set), CategoryID (FK to Category, required).
    -   Define `Category` entity:
        -   Attributes: CategoryID (PK), Name (string, unique, required, e.g., "Sample Packs", "Synth Presets", "DAW Templates", "Tutorials"), Description (text, optional). Seed with initial categories.
    -   Define `Order` entity:
        -   Attributes: OrderID (PK), UserID (FK to User, required), OrderDate (DateTime, auto-set, required), TotalAmount (decimal, required), Status (enum: PendingPayment, Paid, Failed, Fulfilled, Cancelled; required, default PendingPayment), StripePaymentIntentID (string, nullable, indexed), BillingAddress (complex type or separate table - for MVP, can be simplified or deferred if not strictly needed for digital goods and Stripe handles it).
    -   Define `OrderItem` entity:
        -   Attributes: OrderItemID (PK), OrderID (FK, required), ProductID (FK, required), Quantity (int, default 1 for digital, required), PriceAtPurchase (decimal, required).
        -   Relationship: An `Order` can have many `OrderItems`.
    -   Define `Cart` entity (for logged-in users):
        -   Attributes: CartID (PK), UserID (FK to User, unique, required), LastModifiedDate (DateTime, auto-set).
    -   Define `CartItem` entity:
        -   Attributes: CartItemID (PK), CartID (FK, required), ProductID (FK, required), Quantity (int, required, >0), DateAdded (DateTime, auto-set).
        -   Relationship: A `Cart` can have many `CartItems`. ProductID should be unique within a Cart (update quantity instead of adding new row for same product).
    -   Define `UserProductAccess` entity (to manage access to purchased digital products):
        -   Attributes: UserProductAccessID (PK), UserID (FK, required), ProductID (FK, required), OrderID (FK, required), GrantDate (DateTime, auto-set).
        -   Unique constraint on (UserID, ProductID) to prevent duplicate access grants for the same product (unless versioning/re-purchase of different versions is a future concept).
    -   Configure `DbContext` for these new entities.
    -   Generate EF Core migrations.
-   **Acceptance Criteria (ACs):**
    -   AC1: `Product`, `Category`, `Order`, `OrderItem`, `Cart`, `CartItem`, `UserProductAccess` entities are defined with specified attributes and constraints.
    -   AC2: Relationships between entities are correctly configured in EF Core.
    -   AC3: EF Core migration is created and successfully applied locally, creating the new tables with correct schema, foreign keys, and seeding initial Categories.
    -   AC4: The new tables are created in the staging database.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Define `Product` & `Category` POCO entities with enums. Seed Categories.
    -   [ ] Define `Order` & `OrderItem` POCO entities with enums.
    -   [ ] Define `Cart` & `CartItem` POCO entities.
    -   [ ] Define `UserProductAccess` POCO entity.
    -   [ ] Update `DbContext` and configure relationships, unique constraints.
    -   [ ] Generate EF Core migration.

---

### Story 3.2: Add/Manage Digital Products API & Basic UI (Admin)

-   **User Story / Goal:** As an Admin, I want to add and manage digital products (name, description, price, category, image, downloadable file via S3), so that they are available for users to purchase.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected RESTful endpoints (e.g., `POST /api/v1/products`, `PUT /api/v1/products/{productId}`). Requires 'Admin' role.
        -   Functionality to create and update products: Name, Description, Price, CategoryID, IsActive, ProductType.
        -   Handle upload of product image (optional) and digital product file (required) to AWS S3. Store S3 keys. Image upload to `mixwarz-product-images/`, digital file to `mixwarz-product-files/`.
    -   **Frontend (React):**
        -   A "Manage Products" section in the Admin area (Story 4.4 will create the main view, this story ensures the form part).
        -   Form to add/edit product details, including file uploads for image and digital product file. Category selection via dropdown populated from `Categories` table.
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can successfully create a new digital product via API, including uploading its digital file to S3 and optionally an image. Product is linked to a Category.
    -   AC2: Admin can update an existing product's details via API.
    -   AC3: API endpoints are protected and accessible only by 'Admin' role.
    -   AC4: Frontend UI (product add/edit form) allows Admins to input all necessary product information, select a category, and upload files.
    -   AC5: Product image and downloadable file S3 keys are correctly stored, and files are in the respective S3 buckets.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Product Management DTOs (CreateProduct, UpdateProduct).
    -   [ ] Implement Product CRUD controller/service logic for Admins (Create, Update).
    -   [ ] Integrate S3 upload for product image and digital file.
    -   [ ] Develop React product add/edit form component with category dropdown and file uploads.

---

### Story 3.3: List Products API & UI (Public)

-   **User Story / Goal:** As a User, I want to browse a list of available digital products, optionally filtered by category, so that I can discover items to purchase.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Public RESTful endpoint (e.g., `GET /api/v1/products`).
        -   Return a paginated list of `IsActive = true` products (ProductID, Name, Price, ImagePath, CategoryName).
        -   Support filtering by `CategoryID`.
        -   Support basic text search on Product Name and Description.
    -   **Frontend (React):**
        -   A "Store" or "Products" page.
        -   Fetch and display products in a grid or list view, showing image, name, price, category. Handle pagination.
        -   Each product should link to its detail page.
        -   Implement UI for category filtering (e.g., sidebar with category links/dropdown).
        -   Implement a search bar for text search.
-   **Acceptance Criteria (ACs):**
    -   AC1: API returns a paginated list of active products with key display information, respecting category filters and search terms.
    -   AC2: Frontend "Products" page displays products fetched from the API and supports pagination, category filtering, and search.
    -   AC3: Users can click on a product to navigate to its detail view.
    -   AC4: Public API endpoint for listing categories (`GET /api/v1/categories`) is available for populating filter UI.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Product Listing DTO. Implement Get Categories API.
    -   [ ] Implement Get Products controller/service logic for public view (with filtering, search, pagination).
    -   [ ] Create React "Product List" page, "Product Card" component, Category filter UI, Search bar UI.
    -   [ ] Implement API calls and display logic in frontend.

---

### Story 3.4: View Product Details API & UI (Public)

-   **User Story / Goal:** As a User, I want to view detailed information about a specific product, so that I can make an informed purchase decision.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Public RESTful endpoint (e.g., `GET /api/v1/products/{productId}`).
        -   Return detailed information for the active product (all relevant fields from `Product` entity, CategoryName).
    -   **Frontend (React):**
        -   A "Product Details" page.
        -   Fetch and display all relevant product details (images, description, price, category).
        -   Include an "Add to Cart" button.
-   **Acceptance Criteria (ACs):**
    -   AC1: API returns detailed information for a valid and active product ID.
    -   AC2: API returns 404 if product ID is invalid or product is not active.
    -   AC3: Frontend "Product Details" page displays all fetched product information.
    -   AC4: An "Add to Cart" button is visible.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Product Detail DTO.
    -   [ ] Implement Get Product Detail controller/service logic.
    -   [ ] Create React "Product Detail" page component.
    -   [ ] Implement API call and display logic.

---

### Story 3.5: Shopping Cart API & UI (User)

-   **User Story / Goal:** As an Authenticated User, I want to add products to a server-side shopping cart, view its contents, and update quantities, so that I can prepare for checkout. Unauthenticated users will use a client-side cart that merges on login.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected RESTful endpoints for cart management of authenticated users (e.g., `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PUT /api/v1/cart/items/{productId}`, `DELETE /api/v1/cart/items/{productId}`).
        -   Logic to create/retrieve/update `Cart` and `CartItem` records for the logged-in user.
        -   `POST /api/v1/cart/merge` endpoint to merge client-side cart items into server-side cart upon login.
    -   **Frontend (React):**
        -   Client-side cart state management (e.g., using Zustand or React Context) for unauthenticated users.
        -   On login, if client-side cart has items, call the merge API.
        -   UI element to show cart item count (e.g., in header, reflects server cart if logged in, client cart otherwise).
        -   A "Shopping Cart" page displaying items, quantities, prices, line totals, and cart subtotal.
        -   Allow users to update quantity or remove items (triggers API calls if logged in, updates client state otherwise).
        -   "Proceed to Checkout" button.
-   **Acceptance Criteria (ACs):**
    -   AC1: Authenticated user can add/update/remove products in their server-side cart via API; changes are reflected in the database.
    -   AC2: Authenticated user can view their cart contents via API.
    -   AC3: Unauthenticated user's cart actions are managed client-side.
    -   AC4: On login, client-side cart items are merged into the server-side cart.
    -   AC5: Frontend cart UI correctly displays cart contents and allows modifications for both auth states.
    -   AC6: Cart subtotal is calculated and displayed correctly.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Cart and CartItem DTOs.
    -   [ ] Implement server-side Cart CRUD controller/service logic for authenticated users.
    -   [ ] Implement `/cart/merge` API endpoint.
    -   [ ] Implement client-side cart state management in React.
    -   [ ] Create React "Cart" page and integrate client/server cart logic.

---

### Story 3.6: Checkout Process - Order Creation & Payment Gateway Integration (Stripe)

-   **User Story / Goal:** As an Authenticated User with items in my cart, I want to proceed to checkout, provide payment details securely via Stripe Elements, and initiate payment, so that I can purchase the products.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected endpoint to initiate checkout (e.g., `POST /api/v1/checkout/create-payment-intent`).
        -   Retrieves cart items for the authenticated user from their server-side cart.
        -   Calculates total order amount.
        -   Creates a Stripe `PaymentIntent` with the order total, currency, and metadata (e.g., internal order ID placeholder).
        -   Return the `client_secret` of the PaymentIntent to the frontend.
        -   (Order record is created *after* successful payment confirmation from Stripe webhook in Story 3.7, or an initial "Pending" order can be created here and updated by webhook). For MVP, creating the order after webhook confirmation is simpler.
    -   **Frontend (React):**
        -   A "Checkout" page, accessible from the cart.
        -   Display order summary (items, total).
        -   Integrate Stripe Elements for a secure payment form (collects card details directly to Stripe).
        -   On "Pay Now" click, first call backend to get/create PaymentIntent `client_secret`.
        -   Then, use Stripe.js on the client to confirm the card payment using the `client_secret` and payment element.
        -   Handle payment success (e.g., redirect to an order confirmation page) or failure (display error message) from Stripe.js.
-   **Acceptance Criteria (ACs):**
    -   AC1: Backend API successfully creates/retrieves a `PaymentIntent` with Stripe and returns its `client_secret`.
    -   AC2: Frontend Checkout page securely collects payment details using Stripe Elements and displays an order summary.
    -   AC3: Frontend successfully confirms card payment with Stripe.js using the `client_secret`.
    -   AC4: User is redirected to a suitable confirmation page upon successful client-side payment confirmation by Stripe.js, or an error message is shown on failure.
    -   AC5: No sensitive card details are passed to or stored on the MixWarz backend.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Configure Stripe SDK (.NET server-side, Stripe.js client-side).
    -   [ ] Implement backend `/checkout/create-payment-intent` endpoint.
    -   [ ] Create React "Checkout" page with order summary.
    -   [ ] Integrate Stripe Elements for payment form.
    -   [ ] Implement client-side Stripe payment confirmation logic and redirection.

---

### Story 3.7: Payment Confirmation & Order Fulfillment (Webhook & Digital Product Access)

-   **User Story / Goal:** As a System, upon successful payment confirmation from Stripe (via webhook), I want to create the official order record, update its status, and grant the user access to their purchased digital products.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a public webhook endpoint for Stripe (e.g., `POST /api/v1/webhooks/stripe`).
        -   Securely validate the webhook event signature to ensure it's from Stripe.
        -   Handle `payment_intent.succeeded` event:
            -   Retrieve necessary details from the event payload (PaymentIntentID, amount, customer info if available, metadata).
            -   Create `Order` and `OrderItem` records in the database with status 'Paid' or 'Fulfilled'.
            -   For each digital product purchased, create a `UserProductAccess` record linking the User and Product.
            -   (Optional MVP: Send an order confirmation email to the user).
        -   Handle other relevant events like `payment_intent.payment_failed` to update order status to 'Failed'.
-   **Acceptance Criteria (ACs):**
    -   AC1: Backend webhook endpoint correctly receives and validates Stripe `payment_intent.succeeded` events.
    -   AC2: Upon `payment_intent.succeeded`, `Order` and `OrderItem` records are created with 'Paid'/'Fulfilled' status.
    -   AC3: `UserProductAccess` records are created for each purchased digital product, granting access.
    -   AC4: Webhook handles `payment_intent.payment_failed` events appropriately.
    -   AC5: Webhook endpoint is robust and handles potential errors gracefully (e.g., duplicate events, order processing issues).
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Implement Stripe webhook handler endpoint in backend.
    -   [ ] Implement webhook signature validation.
    -   [ ] Implement logic to create `Order`, `OrderItem` records from webhook data.
    -   [ ] Implement logic to create `UserProductAccess` records.
    -   [ ] (Optional) Implement basic order confirmation email service.
    -   [ ] Test webhook with Stripe CLI or test events.

---

### Story 3.8: Basic Order History & Digital Product Access API & UI (User)

-   **User Story / Goal:** As an Authenticated User, I want to view my past orders and access download links for my purchased digital products, so that I can review my purchases and retrieve items.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected endpoint (e.g., `GET /api/v1/orders`) to retrieve the authenticated user's order history.
        -   Return a paginated list of orders (OrderDate, TotalAmount, Status, OrderItems with ProductName).
        -   Protected endpoint (e.g., `GET /api/v1/products/my-purchases`) to list all products the user has purchased (via `UserProductAccess`).
        -   Protected endpoint (e.g., `GET /api/v1/products/{productId}/download-link`) that, for a purchased product, generates a short-lived, secure pre-signed S3 URL for downloading the `DownloadFileS3Key` associated with the `Product`. Requires checking `UserProductAccess`.
    -   **Frontend (React):**
        -   An "Order History" page in the user's account area: Displays a list of past orders.
        -   A "My Downloads" or "My Products" page: Displays a list of purchased digital products. For each product, a "Download" button calls the backend to get a secure download link and initiates the download.
-   **Acceptance Criteria (ACs):**
    -   AC1: API returns a list of the authenticated user's past orders with relevant details.
    -   AC2: API returns a list of products the authenticated user has purchased.
    -   AC3: API provides a secure, short-lived download link for a purchased digital product.
    -   AC4: Frontend "Order History" page displays order history correctly.
    -   AC5: Frontend "My Downloads" page lists purchased products, and users can successfully download their digital products using secure links.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Order History & Purchased Product DTOs.
    -   [ ] Implement Get Order History and Get My Purchased Products API endpoints.
    -   [ ] Implement Get Product Download Link API endpoint (with S3 pre-signed URL generation and access check).
    -   [ ] Create React "Order History" and "My Downloads" pages.
    -   [ ] Implement API calls and display/download logic in frontend.

## Change Log

| Change        | Date       | Version | Description                       | Author         |
| ------------- | ---------- | ------- | --------------------------------- | -------------- |
| Initial Draft | 2025-05-07 | 0.1     | First draft of Epic 3 stories.    | Product Manager AI |
| Revision 1    | 2025-05-07 | 0.2     | Added UserProductAccess entity, refined cart and checkout flow. | Product Manager AI |