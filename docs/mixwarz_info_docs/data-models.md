# MixWarz Data Models

This document defines the core domain entities, API DTOs, and database schemas for the MixWarz application. It complements the information in the Epics and the `MixWarz Application Development Plan_.md`.

## 1. Core Application Entities / Domain Objects (.NET Backend - `MixWarz.Domain/Entities/`)

*These are simplified representations. Refer to backend C# entity classes for full details, including navigation properties, methods, and domain events.*

### User
-   **Description:** Represents a registered user of the platform. Can have roles like User, Organizer, Admin.
-   **Schema / C# Record (Illustrative):**
    ```csharp
    public record UserId(Guid Value); // Strongly-typed ID

    public class User : BaseAuditableEntity<UserId> // Assuming BaseAuditableEntity has Id, Created, LastModified
    {
        public string Username { get; private set; } // Unique
        public string Email { get; private set; }    // Unique
        public string PasswordHash { get; private set; }
        public string PasswordSalt { get; private set; } // Or handled by hashing algo
        public ICollection<Role> Roles { get; private set; } = new HashSet<Role>();
        public DateTime? LastLoginDate { get; set; }
        public OrganizerProfile? OrganizerProfile { get; set; } // Null if not an organizer

        // Navigation Properties (examples)
        // public virtual ICollection<Submission> Submissions { get; private set; } = new List<Submission>();
        // public virtual ICollection<Order> Orders { get; private set; } = new List<Order>();
        // public virtual ICollection<Competition> OrganizedCompetitions { get; private set; } = new List<Competition>();
        // public virtual Cart Cart { get; set; }
    }
    ```
-   **Validation Rules:** Username, Email required & unique. Password complexity rules.

### Role
-   **Description:** Represents a user role (e.g., "Admin", "User", "Organizer").
-   **Schema / C# Record (Illustrative):**
    ```csharp
    public record RoleId(int Value);
    public class Role : BaseEntity<RoleId>
    {
        public string Name { get; private set; } // "Admin", "User", "Organizer"
        public ICollection<User> Users { get; private set; } = new HashSet<User>();
    }
    ```
-   **Seeded Data:** "Admin", "User", "Organizer".

### OrganizerProfile
-   **Description:** Additional details for users with the Organizer role.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record OrganizerProfileId(Guid Value);
    public class OrganizerProfile : BaseEntity<OrganizerProfileId>
    {
        public UserId UserId { get; private set; } // FK to User, One-to-One
        public User User { get; set; }
        public string OrganizationName { get; set; }
        public string Bio { get; set; }
        // public ICollection<Competition> Competitions { get; private set; } = new List<Competition>();
    }
    ```

### Competition
-   **Description:** Represents a mix competition event.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record CompetitionId(Guid Value);
    public class Competition : BaseAuditableEntity<CompetitionId>
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string RulesText { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string PrizeDetails { get; set; }
        public CompetitionStatus Status { get; set; } // Enum: Upcoming, OpenForSubmissions, InJudging, Closed, Cancelled
        public UserId OrganizerUserId { get; private set; } // FK to User
        public User Organizer { get; set; } // Navigation property
        // public ICollection<Submission> Submissions { get; private set; } = new List<Submission>();
    }
    public enum CompetitionStatus { Upcoming, OpenForSubmissions, InJudging, Closed, Cancelled }
    ```

### Submission
-   **Description:** Represents a user's entry into a competition.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record SubmissionId(Guid Value);
    public class Submission : BaseAuditableEntity<SubmissionId>
    {
        public CompetitionId CompetitionId { get; private set; } // FK
        public Competition Competition { get; set; }
        public UserId UserId { get; private set; } // FK
        public User User { get; set; }
        public string AudioFilePath { get; set; } // S3 Key
        public string MixTitle { get; set; }
        public string? MixDescription { get; set; }
        public decimal? Score { get; set; }
        public string? Feedback { get; set; }
        public SubmissionStatus Status { get; set; } // Enum: Submitted, UnderReview, Judged, Disqualified
    }
    public enum SubmissionStatus { Submitted, UnderReview, Judged, Disqualified }
    ```
-   **Constraints:** Unique (CompetitionId, UserId) for MVP.

### Category (E-commerce)
-   **Description:** Product category (e.g., Sample Packs, Presets).
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record CategoryId(int Value);
    public class Category : BaseEntity<CategoryId>
    {
        public string Name { get; set; } // Unique
        public string? Description { get; set; }
        // public ICollection<Product> Products { get; private set; } = new List<Product>();
    }
    ```
-   **Seeded Data:** "Sample Packs", "Synth Presets", "DAW Templates", "Tutorials".

### Product (E-commerce)
-   **Description:** A digital item for sale.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record ProductId(Guid Value);
    public class Product : BaseAuditableEntity<ProductId>
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; } // Must be > 0
        public ProductType ProductType { get; set; } // Enum: SamplePack, PresetBank, etc.
        public string? ImagePath { get; set; } // S3 Key or CDN URL
        public string DownloadFileS3Key { get; set; } // S3 Key for digital product
        public bool IsActive { get; set; } = true;
        public CategoryId CategoryId { get; private set; } // FK
        public Category Category { get; set; }
        // public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();
        // public ICollection<CartItem> CartItems { get; private set; } = new List<CartItem>();
        // public ICollection<UserProductAccess> UserAccessEntries { get; private set; } = new List<UserProductAccess>();
    }
    public enum ProductType { SamplePack, PresetBank, ProjectTemplate, Tutorial }
    ```

### Cart (E-commerce)
-   **Description:** User's shopping cart (server-side for logged-in users).
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record CartId(Guid Value);
    public class Cart : BaseAuditableEntity<CartId> // LastModifiedDate is relevant
    {
        public UserId UserId { get; private set; } // FK, Unique (One-to-One with User)
        public User User { get; set; }
        public ICollection<CartItem> Items { get; private set; } = new List<CartItem>();
    }
    ```

### CartItem (E-commerce)
-   **Description:** An item within a shopping cart.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record CartItemId(Guid Value);
    public class CartItem : BaseEntity<CartItemId>
    {
        public CartId CartId { get; private set; } // FK
        public Cart Cart { get; set; }
        public ProductId ProductId { get; private set; } // FK
        public Product Product { get; set; }
        public int Quantity { get; set; } // > 0
        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
    }
    ```
-   **Constraints:** Unique (CartId, ProductId).

### Order (E-commerce)
-   **Description:** A customer's purchase record.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record OrderId(Guid Value);
    public class Order : BaseAuditableEntity<OrderId> // OrderDate is CreatedDate
    {
        public UserId UserId { get; private set; } // FK
        public User User { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; } // Enum: PendingPayment, Paid, Failed, Fulfilled, Cancelled
        public string? StripePaymentIntentId { get; set; } // Indexed
        // BillingAddress might be a complex type or separate entity if needed beyond Stripe's handling.
        public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();
    }
    public enum OrderStatus { PendingPayment, Paid, Failed, Fulfilled, Cancelled }
    ```

### OrderItem (E-commerce)
-   **Description:** A line item within an order.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record OrderItemId(Guid Value);
    public class OrderItem : BaseEntity<OrderItemId>
    {
        public OrderId OrderId { get; private set; } // FK
        public Order Order { get; set; }
        public ProductId ProductId { get; private set; } // FK
        public Product Product { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtPurchase { get; set; } // Price of the product when order was placed
    }
    ```

### UserProductAccess (E-commerce)
-   **Description:** Grants a user access to a purchased digital product.
-   **Schema / C# Class (Illustrative):**
    ```csharp
    public record UserProductAccessId(Guid Value);
    public class UserProductAccess : BaseAuditableEntity<UserProductAccessId> // GrantDate is CreatedDate
    {
        public UserId UserId { get; private set; } // FK
        public User User { get; set; }
        public ProductId ProductId { get; private set; } // FK
        public Product Product { get; set; }
        public OrderId OrderId { get; private set; } // FK, to link to the purchase
        public Order Order { get; set; }
    }
    ```
-   **Constraints:** Unique (UserId, ProductId) - unless re-purchase of different versions is allowed.

## 2. API Payload Schemas (DTOs - Data Transfer Objects)

*These are defined in the `MixWarz.Application/Features/**/DTOs/` and `MixWarz.API/Controllers/` (as request models). Refer to `docs/api-reference.md` for endpoint details and specific DTOs used. Examples:*

### RegisterUserDto (Request)
```typescript
interface RegisterUserDto {
  username: string;
  email: string;
  password: string; // Will be validated for complexity
}