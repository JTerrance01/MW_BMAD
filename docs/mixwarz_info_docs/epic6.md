# Epic 6: Blog & Content Platform

**Goal:** Implement a blog system allowing administrators to create, manage, and publish articles (with rich text, images, categories, and tags), and enabling users to publicly view and browse these articles, fostering community engagement and knowledge sharing. This directly supports the PRD objective of offering a blog platform.

## Story List

### Story 6.1: Blog Entities & DB Migrations (Article, Category, Tag)

-   **User Story / Goal:** As a Backend Developer, I want to define `BlogArticle`, `BlogCategory`, and `BlogTag` entities, along with their relationships and necessary join tables, and create EF Core migrations, so that blog content and its organization can be persistently stored.
-   **Detailed Requirements:**
    -   Define `BlogArticle` entity (`MixWarz.Domain/Entities/BlogArticle.cs`):
        -   Attributes: `BlogArticleId` (PK), `Title` (string, required), `Slug` (string, unique, indexed, for SEO URLs), `Content` (text, for Rich Text Editor HTML output), `FeaturedImageUrl` (string, S3 key/URL, nullable), `AuthorId` (FK to User, required), `AuthorName` (string, can be denormalized from User), `Status` (enum: Draft, Published; required), `CreatedAt`, `UpdatedAt`, `PublishedAt` (DateTime, nullable).
    -   Define `BlogCategory` entity (`MixWarz.Domain/Entities/BlogCategory.cs`):
        -   Attributes: `BlogCategoryId` (PK), `Name` (string, unique, required), `Slug` (string, unique, indexed).
    -   Define `BlogTag` entity (`MixWarz.Domain/Entities/BlogTag.cs`):
        -   Attributes: `BlogTagId` (PK), `Name` (string, unique, required), `Slug` (string, unique, indexed).
    -   Define join tables for Many-to-Many relationships:
        -   `ArticleCategory` (`BlogArticleId`, `BlogCategoryId`).
        -   `ArticleTag` (`BlogArticleId`, `BlogTagId`).
    -   Update `ApplicationDbContext.cs` to include these new entities and configure relationships.
    -   Implement logic for automatic `Slug` generation from `Title` upon creation/update if `Slug` is not provided (ensuring uniqueness).
    -   Generate and apply EF Core migrations.
    -   Update `docs/data-models.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: `BlogArticle`, `BlogCategory`, `BlogTag`, `ArticleCategory`, `ArticleTag` entities are defined.
    -   AC2: Relationships (Article to User (Author), Article to Categories M2M, Article to Tags M2M) are configured. Slugs have unique constraints.
    -   AC3: `ApplicationDbContext` is updated. EF Core migration is successfully generated and applied.
    -   AC4: `docs/data-models.md` is updated.
    -   AC5: Slug generation mechanism is functional.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Define `BlogArticle`, `BlogCategory`, `BlogTag` entities.
    -   [ ] Define `ArticleCategory`, `ArticleTag` join entities.
    -   [ ] Implement slug generation utility/logic.
    -   [ ] Update `AppDbContext` and configure M2M relationships.
    -   [ ] Generate EF Core migration.
    -   [ ] Apply migration locally.
    -   [ ] Update `docs/data-models.md`.

---

### Story 6.2: Admin - Blog Category & Tag Management API & UI

-   **User Story / Goal:** As an Admin, I want to create, view, edit, and delete blog categories and tags, so that articles can be effectively organized and filtered.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core - Admin Only):**
        -   `POST, GET, PUT, DELETE /api/v1/admin/blog/categories` for CRUD operations on `BlogCategory`.
        -   `POST, GET, PUT, DELETE /api/v1/admin/blog/tags` for CRUD operations on `BlogTag`.
        -   Ensure `Slug` is unique and generated if not provided.
    -   **Frontend (React - Admin Section):**
        -   Admin UI pages for managing categories (list, add, edit, delete forms).
        -   Admin UI pages for managing tags (list, add, edit, delete forms).
    -   Update `docs/api-reference.md` (Admin section) and `docs/ui-ux-spec.md` (Admin blog section).
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can perform full CRUD operations on blog categories via API and UI.
    -   AC2: Admin can perform full CRUD operations on blog tags via API and UI.
    -   AC3: API endpoints are protected ('Admin' role). Slugs are handled correctly.
    -   AC4: Deletion of categories/tags considers impact on existing articles (e.g., disassociation or warning).
    -   AC5: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Develop CRUD command handlers for `BlogCategory`.
    -   [ ] Backend: Implement API endpoints for `BlogCategory` management.
    -   [ ] Backend: Develop CRUD command handlers for `BlogTag`.
    -   [ ] Backend: Implement API endpoints for `BlogTag` management.
    -   [ ] Frontend: Create `CategoryManagementPage.tsx` and `TagManagementPage.tsx` for Admin.
    -   [ ] Frontend: Implement forms and list displays for categories and tags.
    -   [ ] Update documentation.

---

### Story 6.3: Admin - Blog Article CRUD Operations API & UI (with RTE & Image Upload)

-   **User Story / Goal:** As an Admin, I want to create, edit, publish, and unpublish blog articles using a Rich Text Editor, including uploading a featured image, assigning an author, and associating categories/tags, so I can manage the blog's content.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core - Admin Only):**
        -   `POST /api/v1/admin/blog/articles`: Create article (Title, Content, FeaturedImage file, CategoryIDs, TagIDs, Status (Draft/Published)). AuthorId defaults to current admin.
        -   `PUT /api/v1/admin/blog/articles/{articleId}`: Update article.
        -   `GET /api/v1/admin/blog/articles`: List articles (paginated, filter by status/author/category/tag).
        -   `GET /api/v1/admin/blog/articles/{articleId}`: Get specific article for editing.
        -   `DELETE /api/v1/admin/blog/articles/{articleId}`: Delete article (consider soft delete).
        -   Handle `FeaturedImageUrl` upload to S3 (e.g., `blog/featured-images/{articleId_or_slug}/image.ext`), including virus scan.
        -   Manage associations with `BlogCategory` and `BlogTag` via join tables.
    -   **Frontend (React - Admin Section):**
        -   Admin page for creating/editing articles.
        -   Integrate a Rich Text Editor (RTE) component (e.g., Tiptap, Quill).
        -   Fields for Title, Featured Image upload, Category/Tag selection (multi-select from Story 6.2 APIs), Status selection.
    -   Update `docs/api-reference.md` (Admin section) and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: Admin can create a new article with all fields; featured image is scanned, uploaded to S3; categories/tags associated.
    -   AC2: Admin can edit existing articles, including content, image, status, categories, and tags.
    -   AC3: Admin can delete articles.
    -   AC4: Admin can list articles with filtering in the admin panel.
    -   AC5: API endpoints are 'Admin' role protected. RTE provides basic formatting.
    -   AC6: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Implement S3 service & virus scan for blog featured images.
    -   [ ] Backend: Develop CRUD command handlers for `BlogArticle` (incl. associations).
    -   [ ] Backend: Implement `BlogAdminController` with API endpoints.
    -   [ ] Frontend: Select and integrate RTE library.
    -   [ ] Frontend: Develop `ArticleEditPage.tsx` with form, RTE, image upload, category/tag selectors.
    -   [ ] Frontend: Develop `ArticleListPage.tsx` for admin.
    -   [ ] Update documentation.

---

### Story 6.4: Public Blog Article Listing API & UI

-   **User Story / Goal:** As a User, I want to view a paginated list of published blog articles, optionally filtered by category or tag, so that I can discover and browse content.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core - Public):**
        -   `GET /api/v1/blog/articles`: Returns paginated list of *published* articles.
        -   Include: Title, Slug, FeaturedImageUrl, AuthorName, PublishedAt, Summary/Excerpt, associated Categories (names/slugs), Tags (names/slugs).
        -   Support query parameters for pagination (`page`, `pageSize`), filtering by category slug (`category=slug`), tag slug (`tag=slug`).
        -   Default sort: `PublishedAt` descending.
    -   **Frontend (React - Public):**
        -   A "/blog" page displaying articles in a card/list format.
        -   Display article title, image, author, date, summary, categories/tags.
        -   Pagination controls.
        -   UI for filtering by categories and tags (e.g., sidebar links or dropdowns populated from `GET /api/v1/blog/categories` and `GET /api/v1/blog/tags` - new public endpoints).
        -   Each article links to its single view page (Story 6.5) using its slug.
    -   Update `docs/api-reference.md` and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: Public API returns paginated, published articles with specified details, supporting filtering and sorting.
    -   AC2: Public API endpoints to list all categories and tags are available.
    -   AC3: Frontend "/blog" page displays articles, supports pagination, and filtering by category/tag.
    -   AC4: Article cards link correctly to the single article page using slugs.
    -   AC5: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Develop query handlers for public article listing (with filters, pagination) and public category/tag listing.
    -   [ ] Backend: Implement public API endpoints in `BlogController.cs`.
    -   [ ] Frontend: Create `BlogListPage.tsx` and `ArticleCard.tsx`.
    -   [ ] Frontend: Implement category/tag filter components.
    -   [ ] Frontend: Integrate pagination and filtering logic.
    -   [ ] Update documentation.

---

### Story 6.5: Public Single Blog Article View API & UI

-   **User Story / Goal:** As a User, I want to view an individual published blog article with its full content, using an SEO-friendly URL, so that I can read the information shared.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core - Public):**
        -   `GET /api/v1/blog/articles/{slug}`: Retrieves a single *published* article by its unique slug.
        -   Returns: Title, Full Content (HTML), FeaturedImageUrl, AuthorName, PublishedAt, associated Categories (names/slugs), Tags (names/slugs). Return 404 if slug not found or article not published.
    -   **Frontend (React - Public):**
        -   A page template for displaying a single article (e.g., `/blog/{slug}`).
        -   Display article title, author, date, featured image, and full content (rendered from HTML).
        -   Display associated categories and tags (clickable for filtering on list page).
        -   (Optional MVP) Basic social sharing buttons.
    -   Update `docs/api-reference.md` and `docs/ui-ux-spec.md`.
-   **Acceptance Criteria (ACs):**
    -   AC1: Public API returns full details of a published article by slug, or 404.
    -   AC2: Frontend single article page (`/blog/{slug}`) displays all article elements correctly.
    -   AC3: Article content HTML is rendered safely and accurately.
    -   AC4: SEO-friendly URL structure is used.
    -   AC5: Documentation is updated.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Backend: Develop query handler for fetching a single published article by slug.
    -   [ ] Backend: Implement public API endpoint in `BlogController.cs`.
    -   [ ] Frontend: Create `SingleArticlePage.tsx`.
    -   [ ] Frontend: Implement logic to fetch and display article by slug from URL.
    -   [ ] Frontend: Ensure safe rendering of HTML content.
    -   [ ] Update documentation.

## Change Log

| Change        | Date       | Version | Description                                      | Author         |
| ------------- | ---------- | ------- | ------------------------------------------------ | -------------- |
| Initial Draft | 2025-05-08 | 0.1     | First draft of Epic 6 stories.                   | Product Owner / Scrum Master AI |