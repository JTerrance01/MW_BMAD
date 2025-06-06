# Technical Context

## Technology Stack

### Backend

- .NET Core 9.0 Web API
- Clean Architecture approach with distinct layers:
  - Domain: Core entities and business logic
  - Application: Use cases, interfaces, command/query handlers using CQRS with MediatR
  - Infrastructure: Database access, external service integration
  - API: Controllers and presentation logic
- Entity Framework Core 9.0 for ORM with PostgreSQL database
- JWT-based authentication and Role-based authorization
- Redis for caching and session management (AWS ElastiCache)
- AutoMapper for object-object mapping (profiles in Application layer)
- CQRS pattern with MediatR for separating command and query responsibilities
- FluentValidation for request validation
- Service pattern for encapsulating complex domain operations
- Entity Framework Core Migrations for database schema updates

### Frontend

- React with functional components and hooks
- Redux Toolkit for state management
- React Router for client-side routing
- Material-UI (MUI) and React Bootstrap for UI components
- TinyMCE Rich Text Editor (@tinymce/tinymce-react) for content creation
- Axios for API communication
- Formik with Yup for form handling and validation
- React Icons for consistent icon usage
- ESLint for code quality enforcement
- Markdown parser for blog content rendering (planned)
- Client-side file validation and upload progress tracking
- Image preview generation for file uploads
- Chart.js for data visualization in admin dashboard
- Audio playback components for competition submissions:
  - AudioPlayer: Full-featured player with waveform visualization
  - SimpleAudioPlayer: Simplified player based on working AudioPlayer patterns
  - AudioControls: Enhanced button-only controls with defensive rendering

### Data Storage

- PostgreSQL database (AWS RDS)
- Entity Framework Core migrations for schema management
- AWS S3 for file storage (submissions, product images, digital products, blog images, profile pictures)
- Redis for caching and real-time features

### Infrastructure

- AWS cloud services:
  - ECS with Fargate for container orchestration
  - RDS for managed PostgreSQL database
  - ElastiCache for Redis
  - S3 for static assets and file storage
  - CloudFront for content delivery
- Docker for containerization
- CI/CD pipeline with GitHub Actions
- Stripe API for payment processing (planned)

## Development Environment

- Visual Studio 2022 for backend development
- VS Code for frontend development
- Node.js and npm for frontend package management
- SQL Server Management Studio / pgAdmin for database management
- Postman for API testing
- Redis Desktop Manager for cache inspection

## Project Architecture

### Backend Structure

- MixWarz.Domain: Contains entities, value objects, and domain services
- MixWarz.Application: Contains use cases, interfaces, DTOs, and command/query handlers
- MixWarz.Infrastructure: Contains implementations of repository interfaces, data access, and external services
- MixWarz.API: Contains controllers, middleware, and API-specific configuration

### Frontend Structure

- /src
  - /components: Reusable UI components
  - /pages: Page-level components organized by feature
  - /store: Redux store configuration and slices
  - /services: API communication services
  - /utils: Helper functions and utilities
    - apiUtils.js: Common API operations utilities
    - fileUtils.js: File handling and validation utilities
  - /hooks: Custom React hooks

### Recent Architecture Changes

- **Community Features**: Temporarily disabled but preserved for future development
  - Navigation links commented out with "FUTURE:" markers
  - Community Spotlight section on HomePage preserved but disabled
  - All Redux state management and API integration maintained
  - Simple uncomment process for future re-enablement

## Key Implementation Patterns

### CQRS Implementation

- Commands: Mutate state (create, update, delete)
- Queries: Return data without side effects
- MediatR handles dispatching and pipeline behaviors (validation, logging)

### Repository Pattern

- IRepository<T> interface for generic data access
- Specialized repositories for complex data access needs
- Use of async/await for all database operations

### Service Pattern

- Domain-specific services for complex operations (e.g., IBlogService)
- Services implement interfaces defined in Application layer
- Services encapsulate business logic and data access
- Clear separation of responsibilities

### Authentication Flow

- JWT token-based authentication
- Token refresh mechanism
- Role-based authorization (Admin, User, Organizer, Editor)

### Error Handling

- Global exception middleware in API layer
- Custom exception types for domain-specific errors
- Consistent API response format

### File Handling

- Client-side validation for file types and sizes
- Progress tracking for file uploads
- Preview generation for image uploads before submission
- Fallback mechanisms for upload failures
- Server-side validation of uploaded content

### Database Migration Strategy

- Entity Framework Core migrations for database schema updates
- Separate migration files for each schema change
- Clear migration naming convention (e.g., 20250515043213_AddCoverImageUrlToCompetition)
- Migration commands executed during application startup
- Migration history tracked in \_\_EFMigrationsHistory table

## Current Configurations

### Application Settings

- JWT configuration with appropriate expiration and signing options
- CORS policy allowing frontend origin
- Logging configuration with Serilog
- Database connection strings and Redis connection
- File upload limits and allowed content types

### Frontend Configuration

- API base URL configuration
- Authentication token storage in localStorage
- Proxy configuration for local development
- File upload size and type constraints

## Dependencies

### Backend Packages

- Microsoft.AspNetCore.Identity.EntityFrameworkCore
- Microsoft.EntityFrameworkCore
- Microsoft.EntityFrameworkCore.Design
- Npgsql.EntityFrameworkCore.PostgreSQL
- MediatR
- FluentValidation
- AutoMapper
- AWSSDK.S3
- AWSSDK.Extensions.NETCore.Setup
- Microsoft.AspNetCore.Authentication.JwtBearer
- System.IdentityModel.Tokens.Jwt

### Frontend Packages

- React
- React Bootstrap
- Material-UI
- Redux Toolkit
- React Router
- Axios
- Formik
- Yup
- React Icons
- @tinymce/tinymce-react
- React Markdown (planned)
- Chart.js for data visualization

## Environment Variables

- Database connection strings for PostgreSQL
- AWS credentials and configuration (Access Key, Secret Key)
- S3 bucket names for different types of files
- JWT secret key and token configuration
- Stripe API keys (for future implementation)

## File Storage Strategy

- Competition audio files stored in 'mixwarz-submissions' bucket
- Product images stored in 'mixwarz-product-images' bucket
- Digital product files stored in 'mixwarz-product-files' bucket
- Blog images stored in 'mixwarz-blog-images' bucket (planned)
- User profile pictures stored in 'mixwarz-profile-pictures' bucket
- Local file storage in AppData/uploads for development environment
- Presigned URLs used for secure, time-limited access to files

## Technical Debt & Optimizations

- Need to address proxy connection issues between frontend and backend
- Optimize API queries for large datasets with proper pagination
- Implement more comprehensive error handling in frontend components
- Consider adopting React Query for improved data fetching and caching
- Address ESLint warnings for better code quality
- Implement unit and integration tests for critical functionality
- Consider implementing real-time features using SignalR for notifications
- Add optimization for blog content caching and rendering
- Improve file upload error handling and recovery mechanisms
- Add comprehensive validation for all file uploads
- ✅ Fixed validateDOMNesting errors in React components to improve rendering
- ✅ Resolved audio playback issues in voting interface with defensive component architecture
- Continue implementing proper dark theme styling across all components
