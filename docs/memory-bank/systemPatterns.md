# System Patterns

## Architecture

MixWarz follows a Clean Architecture approach with distinct layers:

1. **Domain Layer**: Core entities, domain events, interfaces
2. **Application Layer**: Use cases, commands, queries, validators
3. **Infrastructure Layer**: Repositories, external services, data access
4. **API Layer**: Controllers, middleware, API endpoints
5. **Client Layer**: React frontend application

This architecture ensures separation of concerns and maintainability.

## Architecture Overview

- Modular monolithic system with separate frontend and backend
- React SPA frontend communicating with .NET Core Web API backend via RESTful APIs
- PostgreSQL for primary data storage and Redis for caching/real-time features
- AWS cloud infrastructure (ECS, S3, CloudFront, RDS, ElastiCache)

## Key Technical Decisions

- Clean Architecture principles for backend organization:
  - Domain Layer: Entities, interfaces, and enums
  - Application Layer: Business logic using CQRS with MediatR
  - Infrastructure Layer: External services integration and persistence
  - API Layer: Controllers and request/response handling
- JWT-based authentication with role-based access control (Admin, User, Organizer, Editor)
- File storage with AWS S3 for audio files and digital products
- Stripe integration for payment processing (in progress)
- Data seeding approach for populating the database with initial test data

## Backend Patterns

### CQRS (Command Query Responsibility Segregation)

- **Commands**: Create, Update, Delete operations that modify state
- **Queries**: Read operations that return data without side effects
- Implemented using MediatR library for pipeline behavior

### Repository Pattern

- Generic repository (`IRepository<T>`) for basic CRUD operations
- Specialized repositories for complex queries and operations
- Entity Framework Core used as the ORM
- Asynchronous operations throughout

### Service Pattern

- Specialized services for domain-specific operations (e.g., IBlogService)
- Services implement interfaces defined in the Application layer
- Clear separation of responsibilities between services
- Services encapsulate complex domain operations and business rules

### Transaction Pattern

- **Database Transactions**: Used for critical operations requiring atomicity
- **Pattern Implementation**:
  - Cast `IAppDbContext` to concrete `AppDbContext` to access Database property
  - Wrap operations in `using var transaction = await dbContext.Database.BeginTransactionAsync()`
  - Commit on success: `await transaction.CommitAsync()`
  - Rollback on failure: `await transaction.RollbackAsync()`
- **Example**: Round 1 Vote Tallying uses transactions to ensure all-or-nothing updates

### Unified Processing Pattern

- **Combine Related Operations**: Merge closely related operations into single methods
- **Reduce Database Calls**: Fetch data once and process in memory
- **Example**: `ProcessScoresAndVotesAsync` combines score calculation and vote counting
- **Benefits**:
  - Improved performance with fewer database round trips
  - Simplified logic flow
  - Easier to maintain and debug
  - Better consistency in data processing

### Configurable Business Rules Pattern

- **Entity-Level Configuration**: Store business rule parameters in entities
- **Example**: `Competition.Round1AdvancementCount` instead of hardcoded values
- **Benefits**:
  - Flexible rules per entity instance
  - No code changes for rule adjustments
  - Backward compatibility with defaults
  - Clear audit trail of rule values

### Data Seeding Pattern

- Used `DataSeeder` class in Infrastructure layer for initial data population
- Created entity-specific seed methods for modularity and maintainability
- Implemented relationship handling between entities during seeding
- Used extension methods in Program.cs for seeder registration
- Applied consistent approach for each entity type:
  - Users and Roles
  - Products and Categories
  - Competitions
  - Orders
  - Blog Categories, Tags, and Articles
- Seeded data has realistic values for comprehensive testing
- Created commented passwords in seed data for development purposes

### Mapping Profiles

- AutoMapper used for object-to-object mapping
- Dedicated mapping profiles for each domain:
  - `UserMappingProfile` for user-related mappings
  - `CompetitionMappingProfile` for competition-related mappings
  - `ProductMappingProfile` for product-related mappings
  - `OrderMappingProfile` for order-related mappings
  - `BlogMappingProfile` for blog-related mappings

### API Endpoint Design

- RESTful API design principles
- Resource-based URLs
- Appropriate HTTP methods (GET, POST, PUT, DELETE)
- Consistent response formats

## Frontend Patterns

### Component Architecture

- Functional components with React Hooks
- Container/Presentational pattern where appropriate
- Page components for route targets
- Feature-based organization

### State Management

- Redux Toolkit for global state management
- Use of slices for modular state organization:
  - `authSlice`: Authentication state, user info
  - `competitionSlice`: Competition listings, details
  - `adminSlice`: Admin-specific state
  - `productSlice`: Product catalog state
  - `blogSlice`: Blog articles, categories, and tags (planned)
- Local component state with `useState` for UI-specific state

### UI Styling Patterns

- Consistent dark theme using CSS variables for color management:
  - `--accent-primary` (#00c8ff): Used for headings, links, and emphasis elements
  - `--accent-secondary` (#00e5b3): Secondary accent color for special elements
  - `--text-primary` (rgba(255,255,255,0.95)): Main text content
  - `--text-secondary` (rgba(255,255,255,0.7)): Secondary/supporting text
  - `--bg-primary` (#121212): Main background color
  - `--bg-secondary` (#1e1e1e): Secondary background for cards and panels
  - `--bg-tertiary` (#282828): Tertiary background for nested elements
  - `--border-color` (rgba(255,255,255,0.1)): Subtle borders
- Text hierarchy using consistent color patterns:
  - Headings in accent-primary for emphasis and hierarchy
  - Main content in text-primary for good readability
  - Supporting information in text-secondary for visual hierarchy
- Card-based UI patterns with gradient overlays for improved text contrast
- Badge styling with custom colors and borders based on status
- Consistent form elements styling with proper focus states
- Interactive component styling with hover effects and animations
- Responsive design patterns using Bootstrap grid system
- Custom scrollbar styling for improved UX
- CSS variable-based theming for consistent application-wide styling

### Form Handling

- Formik for form state management and validation
- Yup for schema-based validation
- Controlled components for form inputs

### API Communication

- Axios for HTTP requests
- API service modules for encapsulating API calls
- Redux Toolkit's `createAsyncThunk` for async operations
- Utility functions for reusable API operations (apiUtils.js)

### Data Visualization

- Chart.js for creating interactive charts and graphs
- Integration with React using react-chartjs-2
- Multiple chart types for different data visualization needs:
  - Line charts for time-series data (revenue over time)
  - Bar charts for comparative data (orders per month)
  - Pie charts for distribution data (revenue by category)
- Custom tooltip formatting for enhanced user experience
- Responsive chart sizing for different viewport dimensions
- Custom color schemes matching application theming

### UI Organization

- Tabbed interfaces for content organization (AdminDashboardPage)
- Card-based layouts for grouping related information
- Responsive grid systems using React Bootstrap
- Interactive data tables with sorting functionality
- Consistent icon usage with react-icons
- Status indicators using badges and color-coding
- Progress bars for visualizing relative metrics
- Hover effects for interactive elements
- Loading states with spinner components
- Error handling patterns for failed data fetching

### Routing

- React Router for client-side routing
- Protected routes for authenticated/authorized access
- Route-based code splitting for performance

### File Handling

- Client-side file validation for size and type
- Preview generation for image uploads
- Progress tracking for file uploads
- Error handling for upload failures

## Design Patterns

- Repository pattern for data access with specialized repositories for each entity
- CQRS pattern using MediatR for separating commands (writes) and queries (reads)
- Feature-based folder organization (auth, competitions, products, blog, etc.)
- Mediator pattern for decoupled communication between components
- Service pattern for complex domain operations (e.g., BlogService)
- Validator pattern using FluentValidation for input validation
- DTO pattern for API request and response models

## Data Flow Patterns

### Backend Data Flow

1. Request reaches a controller endpoint
2. Controller maps DTO to command/query using AutoMapper
3. Command/query sent to MediatR pipeline
4. Validation handlers run (FluentValidation)
5. Business logic executed in command/query handlers
6. Data accessed/modified via repositories or domain services
7. Response mapped back to DTO and returned

### Frontend Data Flow

1. User interaction triggers an action creator
2. Action creator dispatches an async thunk
3. Thunk makes API request using Axios
4. API response processed and normalized if needed
5. Success/failure actions dispatched
6. Reducers update Redux store
7. Components re-render with new state

## Integration Points

- Stripe API for payment processing:
  - Product and Price creation for catalog management
  - Checkout Session creation for secure payment processing
  - Customer management for user billing information
  - Subscription management for recurring payments
  - Webhook event processing for automated order fulfillment
  - Digital product access granting via UserProductAccess
- AWS S3 for file storage:

  - Competition audio submissions in 'mixwarz-submissions' bucket
  - Product images in 'mixwarz-product-images' bucket
  - Digital product files in 'mixwarz-product-files' bucket
  - Blog images in 'mixwarz-blog-images' bucket (planned)
  - User profile pictures in 'mixwarz-profile-pictures' bucket

- Database:
  - PostgreSQL for storing all entity data
  - Entity Framework Core for ORM functionality
- Authentication:
  - JWT tokens for authorization
  - Role-based access control for protected resources

## Key Components

### Authentication System

- User and Role entities with proper relationships
- JWT token generation and validation
- Role-based endpoint protection

### Competition Module

- Competition and Submission entities
- File upload/download with S3 presigned URLs
- Judging and scoring system
- Leaderboard functionality
- Competition entity enhanced with CoverImageUrl property
- Submission repository with proper counting functionality

### E-commerce Module

- Product catalog with categories
- Shopping cart functionality
- Order processing pipeline
- Digital product access management
- Secure download links with expiration
- Stripe payment integration with support for:
  - Monthly memberships (recurring subscriptions)
  - Digital products (one-time purchases with automated access)
  - Physical products (one-time purchases with shipping support)
- Automated order fulfillment via webhook processing

### Admin Interface Module

- Role-based access control (Admin role required)
- Consistent controller design in AdminController
- Feature-specific queries and commands for admin operations
- Specialized repository methods for admin data access
- Comprehensive DTO models for admin views
- Extension of repository interfaces for admin-specific operations
- Safety mechanisms (e.g., preventing removal of last admin)
- Repository pattern for encapsulating complex admin queries
- Statistics API with comprehensive data collection and processing:
  - AdminStatisticsVm as a rich view model for dashboard data
  - GetAdminStatisticsQuery and handler following CQRS pattern
  - Complex data aggregation in the query handler
  - Integration with Chart.js for data visualization
  - Multiple visualization techniques for different data types

### Blog Module

- Core entities: BlogArticle, BlogCategory, BlogTag with join entities
- BlogService implementation for encapsulating blog operations
- Feature-specific commands and queries following CQRS pattern
- RESTful API endpoints in BlogController
- Role-based authorization for content management
- Support for categorization and tagging of content
- Slug-based URL structure for SEO-friendly content

### User Profile Module

- User entity extended with profile-related properties
- TestUploadController for testing file uploads and bio updates
- UserProfileController for managing user profile data
- API endpoints for profile picture upload and bio updates
- File validation for supported image formats and sizes
- Profile-specific utility functions in apiUtils.js
- Rich UserProfilePage component with multiple features:
  - Profile information display
  - Bio editing interface with character limits
  - Profile picture upload with preview
  - Progress tracking for uploads
  - Tabbed interface for user content organization

## Recent Component Issues and Fixes

### Import/Reference Issues

- Admin components were referencing incorrect API function names:
  - `fetchCompetitions` vs `fetchAdminCompetitions`
  - `fetchOrders` vs `fetchAdminOrders`
  - `fetchProducts` vs `fetchAdminProducts`
- These were fixed to ensure proper API calls and data flow

### TinyMCE Integration

- TinyMCE editor component used in admin pages for rich text editing
- Properly implemented in `AdminCompetitionsPage.js` for competition rules editing
- Dependent on `@tinymce/tinymce-react` package which is correctly included in package.json
- Will be used for blog content editing in the planned Blog admin interface

### ESLint Warnings

- Several ESLint warnings identified across components:
  - Unused variable declarations
  - Missing dependencies in useEffect hooks
  - Multi-line string syntax issues
- Warnings being addressed systematically to improve code quality

### File Upload Processing

- Improved file validation with client-side checks for:
  - File size limits (2MB for profile pictures)
  - Supported formats (JPEG, PNG)
  - File content validation
- Added progress tracking for file uploads with visual indicators
- Created image preview functionality before upload
- Enhanced error handling for upload failures

### Competition Module Fixes

- Added CoverImageUrl property to Competition entity:
  - Updated Competition.cs with nullable string property
  - Created migration (20250515043213_AddCoverImageUrlToCompetition)
  - This supports displaying competition cover images in the UI
- Fixed SubmissionRepository implementation:
  - Implemented GetSubmissionCountForCompetitionAsync method
  - Previously this method was throwing NotImplementedException
  - The fix resolves errors in the Competition Management page

### Audio Component Architecture (Latest Fix)

- **Audio Playback Component Patterns**:

  - **AudioPlayer Component**: Full-featured audio player with waveform visualization for Judging Interface
  - **SimpleAudioPlayer Component**: Simplified audio player based on AudioPlayer patterns for Voting Interface
  - **AudioControls Component**: Enhanced button-only audio controls with fixed conditional rendering

- **Key Architecture Principles**:

  - **Always-Rendered Audio Elements**: `<audio>` elements always rendered to prevent timing issues
  - **Defensive Event Listener Setup**: Proper checks ensure audio element exists before attaching listeners
  - **Consistent State Management**: All audio components use similar isPlaying/isLoading state patterns
  - **Comprehensive Debug Logging**: Clear console logging with component prefixes for troubleshooting

- **Audio Component Comparison**:

  ```javascript
  // AudioPlayer - Full-featured for Judging Interface
  <AudioPlayer audioUrl={url} entryId={id} title="Anonymous Entry" />

  // SimpleAudioPlayer - Simplified for Voting Interface
  <SimpleAudioPlayer audioUrl={url} submissionId={id} onPlayStateChange={handler} />

  // AudioControls - Enhanced button-only controls
  <AudioControls ref={ref} audioUrl={url} submissionId={id} />
  ```

- **Component Lifecycle Pattern**:

  ```javascript
  // Standard audio component lifecycle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return; // Defensive check

    // Set up event listeners
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    // ... other listeners

    return () => {
      // Clean up listeners
      audio.removeEventListener("play", handlePlay);
      // ... cleanup
    };
  }, [submissionId, audioUrl]);
  ```

- **Audio Element Rendering Pattern**:
  ```javascript
  // Always render audio element (prevents timing issues)
  <audio
    ref={audioRef}
    src={audioUrl || ""}
    preload="metadata"
    style={{ display: "none" }}
  />
  ```

### DOM Nesting Issues

- Fixed validateDOMNesting errors in React components:
  - Removed unwanted whitespace expressions ({" "}) between table elements
  - This improves component rendering and stability
  - These warnings were particularly prevalent in table components

## System Challenges

### API Connectivity

- Proxy errors occurring when frontend connects to backend API
- The React app is configured with proxy in package.json: `"proxy": "https://localhost:7141"`
- Need to ensure backend API is running on the specified port

### Authentication Flow

- JWT-based authentication with token storage in localStorage
- Need to implement proper token refresh mechanism
- Role-based access control for Admin, User, Organizer, and Editor roles

### File Handling

- S3-based file storage for user-uploaded content
- Secure access with presigned URLs
- Need to implement proper file validation and virus scanning
- Local file storage for development with proper directory structure
- Proper handling of file upload edge cases and failures

## UI Design Patterns

- Dark theme is consistently applied across all application components
- Interactive elements have hover animations for better user feedback
- Content areas use high contrast for better readability
- Form controls have consistent styling and focus states
- Admin interface uses a dedicated styling approach with AdminStyles.css:
  - CSS variables define a cohesive color scheme
  - Primary colors include vivid blue (#304FFE), light blue (#536DFE), and purple (#7C4DFF)
  - Background uses dark shades with varying levels of depth
  - Text uses high-contrast white with varying opacity levels
  - Component styling is consistent across tables, forms, buttons, and modals
  - Google Fonts integration with Poppins (headings), Inter (body), and JetBrains Mono (code)
  - Modals are consistently styled with the admin-content class to maintain theme
  - Responsive layouts adapt to different screen sizes
  - Interactive elements have subtle animations and hover effects
  - Form controls use bg-dark text-light border-secondary for consistent appearance

## File Storage Patterns

### Profile Media Storage

- Using AWS S3 for storing profile-related media files:
  - Profile pictures are stored in a dedicated 'profile-pictures' directory
  - Gallery images are stored in 'gallery-images'
  - Audio files are stored in 'audio-files'
- Each user has a directory identified by their UserID for organization
- IFileStorageService abstracts storage implementation details
- Access to files is controlled through expiring URLs for enhanced security
- Mock implementations are provided for development environments

### Competition Media Storage

- Competition cover images are stored in a 'competition-covers' directory
- Multitrack zip files are stored in a 'competition-multitracks' directory for source files
- Submission audio files are stored in a dedicated 'submissions' directory
- Files are accessed through secure, time-limited URLs generated on demand
- File uploads are validated for type, size, and security before storage
- Consistent naming conventions ensure file organization and prevent collisions
- File storage is abstracted through the IFileStorageService interface

### URL Processing Patterns (Latest Implementation)

**Intelligent URL Processing System**:

- **Unified URL Handling**: All competition assets (cover images, multitrack files, mixed tracks, source tracks) use consistent URL processing
- **Double-Encoding Detection**: Automatic detection and repair of URLs containing `https%3A//` patterns
- **Dual Format Support**: Seamless handling of both file paths and full URLs
- **Backward Compatibility**: Works with existing file path data and new full URL formats

**ProcessUrlAsync Pattern**:

```csharp
private async Task<string?> ProcessUrlAsync(string? urlOrPath)
{
    if (string.IsNullOrEmpty(urlOrPath))
        return urlOrPath;

    // Handle double-encoded URLs
    if (urlOrPath.Contains("https%3A//") || urlOrPath.Contains("http%3A//"))
    {
        // Extract and decode the inner URL using regex
        var encodedUrlMatch = Regex.Match(pathAndQuery, @"(https?%3A//[^/\s]+(?:/[^\s]*)*)");
        if (encodedUrlMatch.Success)
        {
            var decodedUrl = HttpUtility.UrlDecode(encodedUrlMatch.Value);
            return decodedUrl;
        }
    }

    // Differentiate between file paths and full URLs
    if (Uri.TryCreate(urlOrPath, UriKind.Absolute, out _))
    {
        return urlOrPath; // Already a full URL
    }
    else
    {
        // File path - generate presigned URL
        return await _fileStorageService.GetFileUrlAsync(urlOrPath, TimeSpan.FromDays(365));
    }
}
```

**Key Benefits**:

- **Automatic URL Repair**: Detects and fixes malformed URLs without manual intervention
- **Centralized Logic**: Single method handles all URL processing for competition assets
- **Debug Logging**: Clear console output for troubleshooting URL issues
- **Future-Proof**: Robust handling for various URL formats and edge cases
- **Performance Optimized**: Efficient processing with minimal overhead

**Implementation Locations**:

- **GetCompetitionDetailQuery.cs**: Primary implementation for competition asset URL processing
- **FileUrlHelper.cs**: Utility class for centralized URL processing functions
- **Query Handlers**: Consistent URL processing across all competition-related queries
