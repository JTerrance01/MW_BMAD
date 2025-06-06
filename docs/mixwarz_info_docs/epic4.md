# Epic 4: Admin Interface MVP

**Goal:** Provide administrators with a basic, centralized interface to manage users, competitions, products, and orders, ensuring they can effectively oversee the platform's core operations during the MVP phase.

## Story List

### Story 4.1: Admin Dashboard Shell & Role-Protected Access

-   **User Story / Goal:** As an Admin, I want a dedicated admin section in the application, accessible only to users with the 'Admin' role, with basic navigation, so that I can securely access management functionalities.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Ensure all API endpoints intended for admin functionalities (defined in subsequent stories in this epic, and potentially some from other epics like product creation) are robustly protected by policies requiring the 'Admin' role.
    -   **Frontend (React):**
        -   Create a distinct URL route for the admin area (e.g., `/admin`).
        -   This route and all its sub-routes must be protected. Access is granted only if the logged-in user's JWT claims include the 'Admin' role (extending or using a specific version of the `ProtectedRoute` from Epic 1).
        -   Implement a basic layout for the admin section (e.g., a persistent sidebar navigation and a main content area for management views).
        -   Navigation links in the sidebar for: Dashboard (overview/stats - placeholder for MVP), User Management, Competition Management, Product Management, Order Management.
-   **Acceptance Criteria (ACs):**
    -   AC1: Users without 'Admin' role are redirected to a "Not Found" or "Access Denied" page (or login if unauthenticated) when attempting to access `/admin` routes.
    -   AC2: Users with 'Admin' role can successfully access the `/admin` area and see the admin layout.
    -   AC3: A basic admin dashboard layout with sidebar navigation links for key management areas is present.
    -   AC4: Navigation links correctly route to their respective (initially placeholder or basic list) admin sections.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Create or enhance `ProtectedRoute` (e.g., `AdminRoute`) in React to specifically check for 'Admin' role in JWT claims.
    -   [ ] Design and implement basic Admin layout component (e.g., `AdminLayout` with `AdminSidebar` and content area).
    -   [ ] Create placeholder components for User, Competition, Product, and Order management pages within the admin area.
    -   [ ] Implement admin navigation links.

---

### Story 4.2: Admin User Management API & UI

-   **User Story / Goal:** As an Admin, I want to view a list of all users, their details (including roles), and be able to assign/change user roles (specifically, promote a User to Organizer or demote an Organizer to User), so that I can manage user access and responsibilities.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected endpoint (e.g., `GET /api/v1/admin/users`) to list all users. Include UserID, Username, Email, current Roles, RegistrationDate. Support pagination and basic search by username or email.
        -   Protected endpoint (e.g., `PUT /api/v1/admin/users/{userId}/roles`) to update a user's roles. Input: UserID and a list of new role names. Ensure an Admin cannot remove their own Admin role if they are the last one (safety check, may be post-MVP refinement but good to note). For MVP, focus on toggling 'Organizer' role.
    -   **Frontend (React):**
        -   An "User Management" page within the admin area.
        -   Display a paginated table or list of users showing key details and current roles. Include search input.
        -   Provide UI controls (e.g., dropdown or button group) for each user to allow an Admin to add/remove the 'Organizer' role.
        -   Confirmation prompt before changing roles.
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can view a paginated and searchable list of all registered users and their current roles via the API and UI.
    -   AC2: Admin can successfully change a user's roles (specifically add/remove 'Organizer' role) via the API and UI.
    -   AC3: API endpoints for user listing and role update are protected and require 'Admin' role.
    -   AC4: UI provides clear feedback on successful role changes or errors. An Admin cannot remove their own 'Admin' status if they are the sole Admin (backend check).
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design User List DTO for Admin view, Update User Roles DTO.
    -   [ ] Implement Admin User List (with search/pagination) and Update User Roles API endpoints. Add role assignment logic.
    -   [ ] Create React "User Management" page with user table/list and search/pagination.
    -   [ ] Implement UI controls for role modification and associated API calls.

---

### Story 4.3: Admin Competition Management View API & UI

-   **User Story / Goal:** As an Admin, I want to view a list of all competitions (regardless of organizer), see their status and details, and have basic management capabilities (e.g., edit core details, manually change status like 'Cancel'), so that I can oversee all competitions on the platform.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected endpoint (e.g., `GET /api/v1/admin/competitions/all`) to list all competitions with extended details (ID, Title, OrganizerUsername, Status, StartDate, EndDate, NumberOfSubmissions). Supports pagination and filtering by status or Organizer.
        -   Admins should be able to use the existing `PUT /api/v1/competitions/{competitionId}` endpoint (from Epic 2, ensuring it allows Admin override for any competition).
        -   Protected endpoint (e.g., `PATCH /api/v1/admin/competitions/{competitionId}/status`) to allow Admins to manually change a competition's status (e.g., to 'Upcoming', 'OpenForSubmissions', 'InJudging', 'Closed', 'Cancelled').
    -   **Frontend (React):**
        -   A "Competition Management" page within the admin area.
        -   Display a paginated table or list of all competitions with filters.
        -   Allow Admins to click to view/edit details (linking to a form similar to Epic 2's Story 2.2, but pre-filled and allowing Admin edits).
        -   Provide UI controls to change competition status (e.g., a dropdown with 'Cancel' option).
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can view a list of all competitions with their details, organizer, and current status via API and UI, with pagination and filtering.
    -   AC2: Admin can update the details of any existing competition.
    -   AC3: Admin can manually change the status of any competition (e.g., to 'Cancelled').
    -   AC4: All related API endpoints are protected and require 'Admin' role.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Admin Competition List/Detail DTOs, Update Competition Status DTO.
    -   [ ] Implement Admin Competition List (all), and Status Change API endpoints. Ensure edit competition API from Epic 2 allows Admin override.
    -   [ ] Create React "Competition Management" page with table, filters, pagination.
    -   [ ] Implement UI for displaying competitions and management actions (status change, link to edit form).

---

### Story 4.4: Admin Product Management View API & UI

-   **User Story / Goal:** As an Admin, I want to view a list of all products, see their details, edit them, and manage their active status, so that I can oversee the e-commerce catalog.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected endpoint (e.g., `GET /api/v1/admin/products/all`) to list all products (ID, Name, Price, CategoryName, IsActive, ProductType). Supports pagination and filtering by Category or IsActive status.
        -   The product creation/full edit API from Epic 3 Story 3.2 (`POST /api/v1/products`, `PUT /api/v1/products/{productId}`) is already admin-only.
        -   Protected endpoint (e.g., `PATCH /api/v1/admin/products/{productId}/toggle-active`) to allow Admins to toggle the `IsActive` status of a product.
    -   **Frontend (React):**
        -   A "Product Management" page within the admin area.
        -   Display a paginated table or list of all products with filters.
        -   Allow Admins to navigate to the full add/edit form (from Epic 3 Story 3.2).
        -   Provide UI controls (e.g., a toggle switch in the list) to quickly change a product's `IsActive` status.
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can view a list of all products with their details and active status via API and UI, with pagination and filtering.
    -   AC2: Admin can toggle the `IsActive` status of any product via API and UI.
    -   AC3: Admin can navigate to the full product add/edit form for any product.
    -   AC4: All related API endpoints are protected and require 'Admin' role.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Admin Product List DTO, Update Product Status DTO.
    -   [ ] Implement Admin Product List (all) and Toggle Active Status API endpoints.
    -   [ ] Create React "Product Management" page with table, filters, pagination.
    -   [ ] Implement UI for displaying products, status management actions, and link to edit form.

---

### Story 4.5: Admin View Orders API & UI

-   **User Story / Goal:** As an Admin, I want to view a list of all orders placed on the platform and their details, including customer information and items purchased, so that I can monitor sales and assist with customer support if needed.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Protected endpoint (e.g., `GET /api/v1/admin/orders/all`) to list all orders.
        -   Include details like OrderID, User's Username/Email, OrderDate, TotalAmount, Status, StripePaymentIntentID, and a list of OrderItems (ProductName, Quantity, PriceAtPurchase).
        -   Support pagination and filtering by Status, User (email/username), or OrderDate range.
        -   Protected endpoint (e.g., `GET /api/v1/admin/orders/{orderId}`) to get full details of a single order.
    -   **Frontend (React):**
        -   An "Order Management" page within the admin area.
        -   Display a paginated table or list of all orders with filters.
        -   Allow Admins to click to view detailed information for each order, including items purchased and customer info.
        -   (No order modification for MVP, view only).
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can view a paginated list of all orders with their key details and status via API and UI, with filtering options.
    -   AC2: Admin can view the specific items included in each order and the purchasing user's information.
    -   AC3: API endpoints for viewing orders (list and detail) are protected and require 'Admin' role.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design Admin Order List and Order Detail DTOs.
    -   [ ] Implement Admin Get Orders (all) and Get Order Detail API endpoints with filtering/pagination.
    -   [ ] Create React "Order Management" page with table and filters.
    -   [ ] Implement UI for displaying orders and navigating to their details.

## Change Log

| Change        | Date       | Version | Description                       | Author         |
| ------------- | ---------- | ------- | --------------------------------- | -------------- |
| Initial Draft | 2025-05-07 | 0.1     | First draft of Epic 4 stories.    | Product Manager AI |
| Revision 1    | 2025-05-07 | 0.2     | Clarified admin scope and API endpoints. | Product Manager AI |