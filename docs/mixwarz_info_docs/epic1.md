# Epic 1: Foundational Setup & User Core

**Goal:** Establish the core infrastructure, CI/CD pipeline, and fundamental user registration, authentication, authorization, and basic profile management, providing the groundwork for all subsequent MixWarz functionalities. This links to PRD goals of launching a functional platform and enabling user interaction.

## Story List

### Story 1.1: Project Scaffolding & Initial CI/CD Pipeline

-   **User Story / Goal:** As a Development Team, we want initial project structures for the .NET Core Backend (Clean Architecture) and React Frontend, a version control repository, and a basic CI/CD pipeline, so that we can automate builds and deployments to a staging environment.
-   **Detailed Requirements:**
    -   Create a Git repository (e.g., on GitHub, AWS CodeCommit).
    -   Set up the .NET Core Web API backend project:
        -   Solution structure adhering to Clean Architecture (Domain, Application, Infrastructure, Presentation/API layers).
        -   Include necessary base NuGet packages (ASP.NET Core, EF Core, JWT libraries).
    -   Set up the React frontend project:
        -   Use `create-react-app` or similar.
        -   Integrate base libraries (React Router, Axios, Material-UI, React Query).
    -   Develop a basic CI/CD pipeline (e.g., AWS CodePipeline with CodeBuild):
        -   Trigger on pushes to the main development branch.
        -   Builds the .NET Core API (Docker image) and pushes to AWS ECR.
        -   Builds the React frontend static assets.
        -   Deploys the API to AWS ECS (Fargate) in a staging environment.
        -   Deploys frontend assets to AWS S3/CloudFront for the staging environment.
        -   The pipeline should execute basic tests (stubs initially, expanded in later stories).
-   **Acceptance Criteria (ACs):**
    -   AC1: Git repository is created and accessible to the development team.
    -   AC2: Backend and frontend project structures are committed to the repository.
    -   AC3: The CI/CD pipeline successfully builds the backend Docker image and frontend assets upon code commit.
    -   AC4: The CI/CD pipeline successfully deploys a "hello world" or basic version of the API to the staging ECS environment.
    -   AC5: The CI/CD pipeline successfully deploys a basic frontend shell to the staging S3/CloudFront environment.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Initialize Git repository.
    -   [ ] Create .NET Core solution with Clean Architecture project layers.
    -   [ ] Create React frontend application.
    -   [ ] Configure AWS CodePipeline, CodeBuild for backend.
    -   [ ] Configure AWS CodePipeline, CodeBuild for frontend.
    -   [ ] Set up AWS ECR repository.
    -   [ ] Configure staging ECS service for API.
    -   [ ] Configure staging S3 bucket and CloudFront distribution for frontend.

---

### Story 1.2: Database Setup & Core User Entity Migrations

-   **User Story / Goal:** As a Backend Developer, I want the PostgreSQL database schema initialized with the core `User` entity and related tables using EF Core migrations, so that user data can be persistently stored.
-   **Detailed Requirements:**
    -   Define the `User` entity in the Domain layer (e.g., UserID, Username, Email, PasswordHash, Salt, Role, RegistrationDate, LastLoginDate).
    -   Define a `Role` entity (e.g., RoleID, RoleName) and establish a many-to-many relationship between User and Role (or a simple string Role property on User for MVP if simpler). The PRD implies defined roles; a separate Role table is cleaner for RBAC.
    -   Configure the `DbContext` in the Infrastructure layer for the `User` and `Role` entities.
    -   Implement EF Core migrations to create the `Users` and `Roles` tables, and a join table for UserRoles. Seed initial roles (Admin, User, Organizer).
    -   Ensure database connection strings are managed securely (e.g., via environment variables or AWS Secrets Manager for deployed environments).
    -   The CI/CD pipeline (or a deployment script) should be able to apply migrations to the staging database.
-   **Acceptance Criteria (ACs):**
    -   AC1: `User` and `Role` entities are defined in the .NET Core backend codebase.
    -   AC2: EF Core migration is created and successfully applied to a local PostgreSQL instance.
    -   AC3: The `Users`, `Roles`, and `UserRoles` tables exist in the staging database with the correct schema after CI/CD deployment or manual migration run. Initial roles (Admin, User, Organizer) are seeded into the `Roles` table.
    -   AC4: Database connection string for the staging environment is configured securely.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Define `User` POCO entity and `Role` entity.
    -   [ ] Configure `DbContext` for `User` and `Role` entities, and their relationship.
    -   [ ] Add EF Core migrations CLI tools to the project.
    -   [ ] Generate initial EF Core migration for `User` and `Role` tables, including seeding roles.
    -   [ ] Script or integrate migration application into the deployment process.

---

### Story 1.3: User Registration API & UI

-   **User Story / Goal:** As an Unauthenticated User, I want to register for a new MixWarz account by providing my username, email, and password, so that I can access platform features.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a RESTful endpoint (e.g., `POST /api/v1/auth/register`).
        -   Accept username, email, and password.
        -   Validate input (e.g., non-empty, valid email format, password complexity rules - e.g., min length 8, one uppercase, one number, one special character).
        -   Check if username or email already exists in the database.
        -   Hash the password using a strong algorithm (e.g., bcrypt, Argon2) with a unique salt per user.
        -   Store the new user record in the database, assigning the default 'User' role.
        -   Return a success response or appropriate error messages (e.g., username/email taken, validation errors).
    -   **Frontend (React):**
        -   Create a registration page/form with fields for username, email, password, and confirm password.
        -   Implement client-side validation for immediate feedback, mirroring backend rules.
        -   On submit, call the registration API endpoint.
        -   Display success message and redirect to login page, or display error messages from the API.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint successfully creates a new user in the database with a hashed password and default 'User' role when valid data is provided.
    -   AC2: API returns an appropriate error if the username or email already exists.
    -   AC3: API returns validation errors for invalid input (e.g., weak password, invalid email format).
    -   AC4: Frontend registration form captures necessary inputs and performs client-side validation.
    -   AC5: Frontend successfully calls the registration API and handles success (e.g., redirects to login) and error responses (displays messages).
    -   AC6: Passwords are not stored in plain text in the database.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design registration DTOs (Request/Response).
    -   [ ] Implement registration controller and application service logic in backend.
    -   [ ] Implement password hashing utility.
    -   [ ] Implement user creation in repository, including assigning default role.
    -   [ ] Create React registration form component.
    -   [ ] Implement API call from frontend using Axios/React Query mutation.

---

### Story 1.4: User Login API & UI (JWT)

-   **User Story / Goal:** As a Registered User, I want to log in with my email and password, so that I can access authenticated features of MixWarz.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a RESTful endpoint (e.g., `POST /api/v1/auth/login`).
        -   Accept email and password.
        -   Validate credentials against stored user data (hashed password comparison).
        -   If valid, generate a JWT containing user ID, username, role(s), and expiration time.
        -   Return the JWT in the response.
        -   Return an appropriate error for invalid credentials or non-existent user.
    -   **Frontend (React):**
        -   Create a login page/form with fields for email and password.
        -   On submit, call the login API endpoint.
        -   On successful login, securely store the JWT (e.g., in memory via state management like Zustand/Context, and potentially backed by localStorage/sessionStorage for persistence across page refreshes, or HttpOnly cookie if backend can set it).
        -   Redirect to a user dashboard or homepage for authenticated users.
        -   Display error messages from the API on failed login.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint successfully validates correct credentials and returns a valid JWT.
    -   AC2: API endpoint returns an appropriate error for incorrect credentials or if the user does not exist.
    -   AC3: JWT contains necessary claims (userID, username, roles, exp).
    -   AC4: Frontend login form captures email and password.
    -   AC5: Frontend successfully calls the login API and handles JWT storage on success.
    -   AC6: User is redirected to an authenticated area upon successful login.
    -   AC7: Login errors are displayed to the user.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design login DTOs.
    -   [ ] Implement login controller and application service logic.
    -   [ ] Implement JWT generation service.
    -   [ ] Create React login form component.
    -   [ ] Implement API call and JWT handling in frontend (consider secure storage).

---

### Story 1.5: Authentication Middleware & Protected Routes

-   **User Story / Goal:** As a Development Team, we want authentication middleware in the backend and a protected route mechanism in the frontend, so that access to certain features/pages is restricted to authenticated users.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Implement ASP.NET Core authentication middleware to validate JWTs from the `Authorization` header on incoming requests.
        -   Configure the middleware to extract user identity (claims) and roles from valid tokens.
        -   Secure specific API endpoints using `[Authorize]` attributes.
        -   Return 401 Unauthorized if a JWT is missing, invalid, or expired for protected endpoints.
    -   **Frontend (React):**
        -   Create a higher-order component or custom hook (`ProtectedRoute`) that checks for the presence and validity (optional basic check) of the stored JWT from the authentication state.
        -   If authenticated, render the requested component/page.
        -   If not authenticated, redirect to the login page.
        -   Axios interceptor to automatically attach the JWT to `Authorization` headers for API requests if a token exists.
-   **Acceptance Criteria (ACs):**
    -   AC1: Backend protected endpoints return 401 Unauthorized if no valid JWT is provided.
    -   AC2: Backend protected endpoints grant access and process requests if a valid JWT is provided.
    -   AC3: Frontend `ProtectedRoute` prevents access to specified routes for unauthenticated users and redirects them to login.
    -   AC4: Frontend `ProtectedRoute` allows access to specified routes for authenticated users.
    -   AC5: Axios instance automatically includes the JWT in requests to the backend API for protected endpoints.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Configure JWT Bearer authentication middleware in backend `Startup.cs` / `Program.cs`.
    -   [ ] Apply `[Authorize]` attribute to a sample protected API endpoint.
    -   [ ] Create `ProtectedRoute` component in React.
    -   [ ] Implement Axios request interceptor for adding JWT.

---

### Story 1.6: Basic Role-Based Authorization (RBAC)

-   **User Story / Goal:** As a Backend Developer, I want to implement basic role-based authorization using attributes, so that access to specific API endpoints can be controlled based on user roles defined in their JWT.
-   **Detailed Requirements:**
    -   Ensure the JWT includes the user's role(s) as claims (established in Story 1.2 and 1.4).
    -   Utilize .NET Core's built-in role-based authorization by applying attributes like `[Authorize(Roles = "Admin")]` or `[Authorize(Roles = "Organizer,Admin")]` to specific API controller actions or controllers.
    -   This story focuses on the backend setup for enforcing RBAC on API endpoints. UI differentiation based on roles will be handled in context-specific epics.
-   **Acceptance Criteria (ACs):**
    -   AC1: An API endpoint protected with `[Authorize(Roles = "Admin")]` is inaccessible (returns 403 Forbidden) to a user whose JWT contains only 'User' role.
    -   AC2: An API endpoint protected with `[Authorize(Roles = "Admin")]` is accessible to a user whose JWT contains 'Admin' role.
    -   AC3: An API endpoint protected with `[Authorize(Roles = "Organizer")]` is inaccessible (returns 403 Forbidden) to a user with only 'User' role but accessible to an 'Organizer'.
    -   AC4: If a user is authenticated but does not have the required role for an endpoint, a 403 Forbidden status is returned (not 401 Unauthorized).
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Ensure JWT generation correctly includes role claims.
    -   [ ] Apply `[Authorize(Roles = "...")]` to various sample protected API endpoints representing different role requirements.
    -   [ ] Write integration tests to verify RBAC for different roles and endpoints.

---

### Story 1.7: Basic User Profile Management API & UI (View Only for MVP Core)

-   **User Story / Goal:** As an Authenticated User, I want to view my basic profile information (username, email, roles), so that I can confirm my account details.
-   **Detailed Requirements:**
    -   **Backend API (.NET Core):**
        -   Create a protected RESTful endpoint (e.g., `GET /api/v1/users/me` or `GET /api/v1/profile`) that retrieves the currently authenticated user's details (username, email, roles) using information from the JWT claims.
    -   **Frontend (React):**
        -   Create a basic "My Profile" page accessible to authenticated users (e.g., via a link in the user dropdown).
        -   Fetch and display the user's username, email, and roles from the API.
        -   Editing capabilities are deferred to post-MVP or specific settings stories.
-   **Acceptance Criteria (ACs):**
    -   AC1: API endpoint returns the authenticated user's username, email, and roles.
    -   AC2: API endpoint is protected and returns 401 if no valid JWT is provided.
    -   AC3: Frontend "My Profile" page successfully fetches and displays the user's profile information.
    -   AC4: Unauthenticated users cannot access the "My Profile" page.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Design profile DTO.
    -   [ ] Implement profile API endpoint in backend that reads data from JWT claims.
    -   [ ] Create React profile page component.
    -   [ ] Implement API call to fetch profile data using React Query.

---

### Story 1.8: Local Development Environment Setup (Docker Compose)

-   **User Story / Goal:** As a Developer, I want a `docker-compose.yml` file to easily set up and run the backend API, PostgreSQL database, and Redis locally, so that I can have a consistent development environment.
-   **Detailed Requirements:**
    -   Create a `docker-compose.yml` file at the root of the project.
    -   Define services for:
        -   The .NET Core Web API (building from its Dockerfile).
        -   PostgreSQL database (using an official image, configuring default user/password, and persisting data using volumes).
        -   Redis (using an official image).
    -   Ensure services can communicate with each other (e.g., API can connect to DB and Redis using service names as hostnames).
    -   Include instructions in the main `README.md` on how to use Docker Compose to start/stop the environment.
-   **Acceptance Criteria (ACs):**
    -   AC1: `docker-compose up` successfully starts the API, PostgreSQL, and Redis containers.
    -   AC2: The API container can connect to the PostgreSQL container.
    -   AC3: The API container can connect to the Redis container.
    -   AC4: PostgreSQL data is persisted across `docker-compose down` and `up` cycles.
    -   AC5: `README.md` includes clear instructions for using the Docker Compose setup.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Create Dockerfile for the .NET Core API (if not fully completed in Story 1.1).
    -   [ ] Write `docker-compose.yml` defining API, PostgreSQL, and Redis services with necessary environment variables and volume mounts.
    -   [ ] Test local environment setup and inter-service communication.
    -   [ ] Document Docker Compose usage in `README.md`.

---

### Story 1.9: Initial AWS Infrastructure Stubs (IaC)

-   **User Story / Goal:** As a DevOps Team, we want initial Infrastructure as Code (IaC) scripts (e.g., using AWS CDK, CloudFormation, or Terraform) for essential AWS services for the staging environment, so that infrastructure provisioning can be automated, version-controlled, and repeatable.
-   **Detailed Requirements:**
    -   Develop basic IaC scripts/definitions for:
        -   VPC, Subnets (public/private), Security Groups.
        -   AWS ECR repository for Docker images.
        * AWS ECS Cluster and Service Definition for the API (Fargate).
        * Application Load Balancer (ALB) for the API.
        * AWS RDS instance for PostgreSQL (staging configuration, e.g., db.t3.micro).
        * AWS ElastiCache for Redis (staging configuration, e.g., cache.t3.micro).
        * AWS S3 bucket for frontend static assets.
        * AWS CloudFront distribution for the S3 bucket.
        * Basic IAM roles for services (e.g., ECS task role, CodeBuild role) adhering to least privilege.
    -   These scripts will be expanded and refined throughout development.
    -   Focus on the staging environment initially.
    -   Store IaC scripts in the Git repository.
-   **Acceptance Criteria (ACs):**
    -   AC1: Basic IaC scripts for core AWS networking, ECR, ECS, ALB, RDS, ElastiCache, S3, and CloudFront are created and committed.
    -   AC2: Scripts can be deployed (manually or via CI/CD step) to successfully provision these resources in a staging AWS account.
    -   AC3: IAM roles and security groups defined in IaC adhere to basic least privilege principles, allowing necessary communication between services.
    -   AC4: The CI/CD pipeline from Story 1.1 can deploy the application to the IaC-provisioned staging environment.
-   **Tasks (Optional Initial Breakdown):**
    -   [ ] Choose IaC tool (e.g., AWS CDK preferred for .NET/TS teams, or Terraform).
    -   [ ] Write IaC for networking (VPC, Subnets, Security Groups, ALB).
    -   [ ] Write IaC for ECR.
    -   [ ] Write IaC for ECS (Cluster, Task Definition, Service).
    -   [ ] Write IaC for RDS (PostgreSQL instance).
    -   [ ] Write IaC for ElastiCache (Redis instance).
    -   [ ] Write IaC for S3 bucket and CloudFront distribution.
    -   [ ] Write IaC for necessary IAM roles.
    -   [ ] Test deployment of IaC to staging.

## Change Log

| Change        | Date       | Version | Description                                      | Author         |
| ------------- | ---------- | ------- | ------------------------------------------------ | -------------- |
| Initial Draft | 2025-05-07 | 0.1     | First draft of Epic 1 stories.                   | Product Manager AI |
| Revision 1    | 2025-05-07 | 0.2     | Refined details in stories 1.2, 1.3, 1.4, 1.6, 1.9 | Product Manager AI |