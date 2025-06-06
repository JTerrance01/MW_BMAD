# MixWarz UI/UX Specification

## Introduction

This document defines the high-level user experience (UX) goals, information architecture (IA), key user flows, and foundational visual design principles for the Minimum Viable Product (MVP) of the MixWarz web application. It serves as a guide for creating an intuitive, engaging, and accessible interface for users.

-   **Link to Primary Design Files:** *(Placeholder: To be linked when detailed mockups/prototypes are created, e.g., Figma, Sketch, Adobe XD URL)*
-   **Link to Deployed Storybook / Design System:** *(Placeholder: To be linked if a Storybook is developed for UI components)*

## Overall UX Goals & Principles

-   **Target User Personas:**
    * **Aspiring Producer/Engineer ("Alex"):** Eager to learn, showcase skills, find quality tools, and connect with a community. Values clear instructions, fair competition, and affordable resources.
    * **Working Professional ("Jamie"):** Busy, seeks credible competitions for recognition, looks for high-quality, time-saving digital assets. Values efficiency, clear information, and a professional interface.
    * **Hobbyist ("Casey"):** Passionate about music production, enjoys friendly competition and discovering new sounds/tools. Values a fun, engaging experience and community interaction.
    * **(Admin/Organizer personas are also key but this spec focuses on the public-facing user experience primarily for MVP feature interaction.)**
-   **Usability Goals:**
    * **Ease of Learning:** Users should quickly understand how to navigate the platform, enter competitions, and purchase products.
    * **Efficiency of Use:** Core tasks (submission, purchase) should be achievable in a minimal number of steps.
    * **Error Prevention & Recovery:** Clear guidance and validation to prevent errors; helpful messages to recover when errors occur.
    * **Discoverability:** Users should easily find active competitions and relevant products.
-   **Design Principles:**
    1.  **Clarity First:** Prioritize clear language, intuitive layouts, and straightforward interactions over overly complex or "clever" design.
    2.  **Community Focused:** Design should feel welcoming and foster a sense of belonging and fair play.
    3.  **Empowerment & Growth:** The platform should make users feel empowered to showcase their skills and discover tools that help them improve.
    4.  **Consistency:** Maintain consistent UI patterns, terminology, and visual styling across both the competition and e-commerce modules for a cohesive experience.
    5.  **Provide Feedback:** The system should always provide clear feedback to users about their actions (e.g., successful submission, item added to cart, payment processing).

## Information Architecture (IA)

-   **Site Map / Screen Inventory (MVP):**

    ```mermaid
    graph TD
        subgraph PublicArea["Public Area"]
            Homepage["Homepage (/)"]
            Login["Login (/login)"]
            Register["Register (/register)"]
            CompetitionsList["Competitions List (/competitions)"]
            CompetitionDetail["Competition Detail (/competitions/:id)"]
            ProductsList["Products List (/products)"]
            ProductDetail["Product Detail (/products/:id)"]
        end

        subgraph AuthenticatedUserArea["Authenticated User Area"]
            UserProfile["User Profile (/profile)"]
            UserSubmissions["My Submissions (/profile/submissions)"] --> UserProfile
            OrderHistory["My Orders (/profile/orders)"] --> UserProfile
            MyDownloads["My Downloads (/profile/downloads)"] --> UserProfile
            CompetitionSubmitForm["Submit to Competition (/competitions/:id/submit)"]
            ShoppingCart["Shopping Cart (/cart)"]
            Checkout["Checkout (/checkout)"]
            OrderConfirmation["Order Confirmation (/order/success)"]
        end

        subgraph AdminOrganizerArea["Admin & Organizer Area"]
            AdminDashboard["Admin Dashboard (/admin/dashboard)"]
            AdminUserMgmt["User Management (/admin/users)"]
            AdminCompetitionMgmt["Competition Management (/admin/competitions)"]
            AdminCreateEditCompetition["Create/Edit Competition (/admin/competitions/form/:id?)"] --> AdminCompetitionMgmt
            AdminProductMgmt["Product Management (/admin/products)"]
            AdminCreateEditProduct["Create/Edit Product (/admin/products/form/:id?)"] --> AdminProductMgmt
            AdminOrderMgmt["Order Management (/admin/orders)"]
            OrganizerDashboardStub["Organizer Dashboard Stub (/organizer/dashboard)"]
            OrganizerCreateCompetition["(Organizer) Create Competition (shares /admin/competitions/form)"] --> OrganizerDashboardStub
            OrganizerManageSubmissions["(Organizer) Manage Submissions (/organizer/competitions/:id/submissions)"] --> OrganizerDashboardStub
        end

        Homepage --> CompetitionsList
        Homepage --> ProductsList
        Homepage --> Login
        Homepage --> Register

        CompetitionsList --> CompetitionDetail
        CompetitionDetail -- Authenticated & Open --> CompetitionSubmitForm

        ProductsList --> ProductDetail
        ProductDetail -- Add to Cart --> ShoppingCart

        ShoppingCart --> Checkout
        Checkout --> OrderConfirmation

        %% Navigation Links
        NavbarPublic["Public Navbar (Logo, Competitions, Products, Login, Register)"]
        NavbarUser["Authenticated User Navbar (Logo, Competitions, Products, Cart, UserMenu[Profile, Logout])"]
        AdminSidebar["Admin Sidebar Nav (Dashboard, Users, Competitions, Products, Orders)"]

        NavbarPublic --- Homepage

        NavbarUser --- UserProfile

        AdminDashboard --> AdminUserMgmt
        AdminDashboard --> AdminCompetitionMgmt
        AdminDashboard --> AdminProductMgmt
        AdminDashboard --> AdminOrderMgmt

        UserProfile --> OrderHistory
        UserProfile --> UserSubmissions
        UserProfile --> MyDownloads
    ```

-   **Navigation Structure:**
    * **Public Navigation (Header):** Logo (to Homepage), Competitions, Products, Login, Register.
    * **Authenticated User Navigation (Header):** Logo (to Homepage), Competitions, Products, Shopping Cart (icon with item count), User Menu (dropdown: My Profile, My Submissions, My Orders, My Downloads, Logout).
    * **Admin Area Navigation (Sidebar on `/admin/*` routes):** Dashboard, User Management, Competition Management, Product Management, Order Management.
    * **Organizer Area (MVP Stub):** A simple "Organizer Dashboard" page accessible via user menu if user has 'Organizer' role. This page could link to the shared "Create/Edit Competition" form and a view to manage submissions for their own competitions.
    * **Breadcrumbs:** Recommended for nested views like Competition Detail, Product Detail, and within Admin/Organizer sections.

## User Flows (MVP Examples)

### 1. New User Registration

-   **Goal:** A new visitor creates a MixWarz account.
-   **Actor:** Unauthenticated Visitor.
-   **Trigger:** Clicks "Register" link/button.
-   **Steps / Diagram:**
    ```mermaid
    graph TD
        A[Visit Site] --> B{Clicks "Register"};
        B --> C[Display Registration Form (Username, Email, Password, Confirm Password)];
        C --> D{User fills form & clicks "Register"};
        D -- Validation Fails (Client-side) --> E[Show inline validation errors on form];
        E --> C;
        D -- Validation Passes (Client-side) --> F[API Call: POST /api/v1/auth/register];
        F -- API: Username/Email Taken --> G[Show "Username/Email already exists" error message on form];
        G --> C;
        F -- API: Other Validation Error --> H[Show relevant error message on form];
        H --> C;
        F -- API: Success --> I[Show "Registration Successful!" message];
        I --> J[Redirect to Login Page (/login) with optional "Please log in" message];
    ```

### 2. Submit to a Competition

-   **Goal:** An authenticated user submits their mix to an open competition.
-   **Actor:** Authenticated User (Role: User).
-   **Preconditions:** User is logged in. Target competition exists and its status is 'OpenForSubmissions'. User has not already submitted to this competition.
-   **Trigger:** Clicks "Submit Entry" button on Competition Detail page.
-   **Steps / Diagram:**
    ```mermaid
    graph TD
        A[User views Competition Detail page (Status: OpenForSubmissions)] --> B{Clicks "Submit Entry"};
        B --> C[Navigate to Submission Form (/competitions/:id/submit)];
        C --> D[Display Submission Form (Fields: Mix Title, Mix Description (opt), Audio File Input)];
        D --> E{User fills form, selects audio file & clicks "Submit My Mix"};
        E -- Client Validation Fails (e.g., no file, wrong type, title missing) --> F[Show inline validation errors];
        F --> D;
        E -- Client Validation Passes --> G[API Call: POST /api/v1/competitions/:id/submissions (multipart/form-data)];
        G -- File Upload Progress (Optional) --> H[Show file upload progress indicator];
        H -- API: Validation/Auth Error (e.g., comp closed, already submitted, file too large) --> I[Show specific error message on form];
        I --> D;
        H -- API: Success --> J[Show "Submission Successful!" message];
        J --> K[Redirect to "My Submissions" page or back to Competition Detail page];
    ```

### 3. Purchase a Digital Product

-   **Goal:** An authenticated user purchases one or more digital products.
-   **Actor:** Authenticated User (Role: User).
    **Preconditions:** User is logged in. Products exist and are active. Cart may or may not have items.
-   **Steps / Diagram:**
    ```mermaid
    graph TD
        subgraph Product Discovery & Cart
            PD[View Product Detail Page] --> AC{Clicks "Add to Cart"};
            AC --> AC_API[API: Add to Cart];
            AC_API --> AC_FB[Cart icon updates, "Item added" feedback];
        end
        Cart[View Shopping Cart Page (/cart)] --> PC{Clicks "Proceed to Checkout"};
        PC --> CO[Navigate to Checkout Page (/checkout)];
        CO --> OF[Display Order Summary & Stripe Payment Element];
        OF --> Pay{User enters payment details & Clicks "Confirm & Pay"};
        Pay -- Stripe Client-Side Validation Fails --> ErrPay[Show error in Stripe Element];
        ErrPay --> OF;
        Pay -- Stripe Client-Side OK --> PI_API[FE calls BE: /checkout/create-payment-intent];
        PI_API -- BE Error --> ErrBE[Show general payment error];
        ErrBE --> OF;
        PI_API -- BE Success (returns client_secret) --> StripeConfirm[FE: Stripe.js confirms payment with client_secret];
        StripeConfirm -- Stripe.js Payment Fails --> ErrStripe[Show Stripe error message];
        ErrStripe --> OF;
        StripeConfirm -- Stripe.js Payment Success --> OrderConf[Navigate to Order Confirmation Page (/order/success)];
        OrderConf --> Access[User can access product via "My Downloads" / Order History];
    ```

## Wireframes & Mockups

-   *(Placeholder: This section will link to specific frames/pages in the primary design file (e.g., Figma) once detailed visual designs are created for key MVP screens. Initial focus should be on clarity and MUI's default capabilities, customized with branding.)*
-   **Key Screens for MVP Wireframing/Mockups:**
    * Homepage (simple, with clear CTAs to Competitions & Products)
    * User Registration & Login Forms
    * Competition List & Competition Detail Page
    * Competition Submission Form
    * Product List (with filters) & Product Detail Page
    * Shopping Cart Page
    * Checkout Page (including Stripe Elements integration)
    * Order Confirmation Page
    * User Profile (sections for My Submissions, My Orders, My Downloads)
    * Admin: User Management List & Role Edit
    * Admin: Competition Management List & Create/Edit Form
    * Admin: Product Management List & Create/Edit Form
    * Admin: Order Management List & Detail View
-   **Key Layout Principles:**
    * Clean, modern aesthetic leveraging Material-UI components.
    * Emphasis on readability and clear calls to action.
    * Visual hierarchy to guide user attention.
    * Responsive design for desktop, tablet, and mobile from the outset.

## Component Library / Design System Reference

-   **Primary UI Library:** Material-UI (MUI) will be used as the foundational component library. Its comprehensive set of components, theming capabilities, and accessibility support align well with project needs.
-   **Customization:** MUI components will be styled and themed (colors, typography, spacing, border-radius) to align with MixWarz's unique brand identity once established. A global theme provider will be configured.
-   **Key Custom Components (Examples - to be detailed later if MUI doesn't cover them sufficiently):**
    * `CompetitionCard`: For displaying competition summaries.
    * `ProductCard`: For displaying product summaries.
    * `FileUploadInput`: For a user-friendly file upload experience with progress and validation feedback.
    * `RichTextEditor`: For competition rules/descriptions and product descriptions (if complex formatting is needed).
-   *(Placeholder: Link to Storybook or detailed component specs in Figma when available.)*

## Branding & Style Guide Reference

-   *(Placeholder: This section will link to a full branding guide or detail key elements here once the MixWarz brand identity is finalized.)*
-   **Color Palette (Illustrative - TBD):**
    * Primary Interactive: (e.g., A vibrant blue or teal - for buttons, links, active states)
    * Secondary Accent: (e.g., A contrasting color like orange or purple - for highlights, special CTAs)
    * Dark Tones: (e.g., Deep blues, charcoals - for text, backgrounds, structural elements)
    * Light Tones: (e.g., Off-whites, light grays - for backgrounds, cards)
    * Feedback: Standard Green (success), Red (error), Yellow (warning), Blue (info).
-   **Typography (Illustrative - TBD):**
    * Headings: A modern, clean sans-serif (e.g., Inter, Montserrat, Open Sans Condensed).
    * Body Text: A highly readable sans-serif (e.g., Open Sans, Lato, Roboto).
    * Font weights and sizes will be defined in a type scale for consistency.
-   **Iconography:** Material Icons (via MUI) will be the primary source, ensuring visual consistency. Custom icons for specific MixWarz concepts if necessary.
-   **Spacing & Grid:** A consistent spacing scale (e.g., based on 4px or 8px multiples) and a responsive layout grid (e.g., 12-column for wider screens) will be used, leveraging MUI's grid system.

## Accessibility (AX) Requirements

-   **Target Compliance:** WCAG 2.1 Level A as a minimum for all content, aiming for Level AA for key user flows and components.
-   **Specific Requirements (MVP Focus):**
    * All interactive elements (buttons, links, form inputs) must be keyboard accessible and focusable, with clear focus indicators.
    * Semantic HTML structure (correct use of `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`, headings `<h1>`-`<h6>`, lists `<ul>`/`<ol>`, etc.).
    * Sufficient color contrast between text and background (minimum 4.5:1 for normal text, 3:1 for large text). Tools like WebAIM Contrast Checker will be used.
    * ARIA (Accessible Rich Internet Applications) attributes used appropriately for dynamic content and custom components if MUI defaults are insufficient (e.g., `aria-label`, `aria-describedby`, roles for custom widgets).
    * Meaningful alternative text (`alt` attributes) for all informative images; decorative images should have empty `alt=""`.
    * Forms to have clear, programmatically associated labels for all inputs. Error messages should be clearly associated with their respective inputs.
    * Ensure page titles are descriptive and unique.

## Responsiveness

-   **Breakpoints:** Standard Material-UI breakpoints will be used as a baseline:
    * `xs`: 0px
    * `sm`: 600px
    * `md`: 900px
    * `lg`: 1200px
    * `xl`: 1536px
-   **Adaptation Strategy:**
    * Use of MUI's responsive grid system (`<Grid container spacing={...}>`).
    * Flexible images and media.
    * Navigation (main nav, admin sidebar) will adapt for smaller screens (e.g., main nav collapses to a hamburger menu, admin sidebar may auto-hide or transform).
    * Content will reflow gracefully. Multi-column layouts on desktop may stack to single-column on mobile.
    * Touch target sizes will be adequate for mobile interaction (e.g., min 44x44px for critical targets).
    * Testing across common viewport sizes (Chrome DevTools device emulation) and representative physical devices is required.

## Change Log

| Change        | Date       | Version | Description                                     | Author             |
| ------------- | ---------- | ------- | ----------------------------------------------- | ------------------ |
| Initial Draft | 2025-05-07 | 0.1     | Foundational UI/UX Spec for MixWarz MVP.        | Product Manager AI |