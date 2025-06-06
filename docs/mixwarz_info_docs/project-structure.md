# MixWarz Project Structure

This document outlines the recommended project structure for MixWarz, accommodating both the .NET Core backend and the React frontend. The structure is designed to promote modularity, separation of concerns (especially for Clean Architecture in the backend), and ease of development for AI agents.

## Monorepo Structure (Recommended)

A monorepo structure using a tool like Nx or Lerna, or simply a well-organized multi-project setup within a single Git repository, is suggested for managing the frontend and backend codebases together. For simplicity, the structure below assumes a single Git repository with distinct top-level directories for backend and frontend.

```plaintext
mixwarz-app/
├── .github/                    # CI/CD workflows (e.g., GitHub Actions or AWS CodePipeline YAML)
│   └── workflows/
│       └── main.yml            # Main CI/CD pipeline definition
├── .vscode/                    # VSCode editor settings (optional)
│   └── settings.json
├── docs/                       # Project documentation (PRD, Arch, this file, etc.)
│   ├── architecture.md
│   ├── api-reference.md
│   ├── coding-standards.md
│   ├── data-models.md
│   ├── environment-vars.md
│   ├── project-structure.md  (this file)
│   ├── tech-stack.md
│   ├── testing-strategy.md
│   ├── ui-ux-spec.md
│   ├── epic1.md
│   ├── epic2.md
│   ├── epic3.md
│   └── epic4.md
├── infra/                      # Infrastructure as Code (AWS CDK - TypeScript)
│   ├── bin/
│   │   └── mixwarz-infra.ts    # CDK App entry point
│   ├── lib/
│   │   ├── mixwarz-vpc-stack.ts
│   │   ├── mixwarz-database-stack.ts
│   │   ├── mixwarz-cache-stack.ts
│   │   ├── mixwarz-backend-stack.ts
│   │   ├── mixwarz-frontend-stack.ts
│   │   └── mixwarz-cicd-stack.ts
│   ├── test/                   # Unit tests for IaC
│   ├── cdk.json
│   └── tsconfig.json
├── backend/                    # .NET Core Web API (Clean Architecture)
│   ├── MixWarz.sln             # Visual Studio Solution File
│   ├── src/
│   │   ├── MixWarz.Domain/     # Domain Layer: Entities, Enums, Domain Events, Interfaces (IRepositories)
│   │   │   ├── Entities/
│   │   │   ├── Enums/
│   │   │   ├── Events/
│   │   │   └── Interfaces/
│   │   ├── MixWarz.Application/ # Application Layer: Use Cases, DTOs, Application Service Interfaces, Validation
│   │   │   ├── Features/       # CQRS-style feature folders (e.g., Competitions, Users, Products)
│   │   │   │   ├── Competitions/
│   │   │   │   │   ├── Commands/
│   │   │   │   │   │   └── CreateCompetition/
│   │   │   │   │   │       ├── CreateCompetitionCommand.cs
│   │   │   │   │   │       └── CreateCompetitionCommandHandler.cs
│   │   │   │   │   ├── Queries/
│   │   │   │   │   └── DTOs/
│   │   │   ├── Common/
│   │   │   │   ├── Interfaces/ # Interfaces for infrastructure services (IEmailService, IFileStorageService)
│   │   │   │   └── Behaviors/  # MediatR pipeline behaviors (Validation, Logging)
│   │   │   └── Mappings/       # AutoMapper profiles or manual mapping logic
│   │   ├── MixWarz.Infrastructure/ # Infrastructure Layer: EF Core, Repositories, External Service Clients
│   │   │   ├── Persistence/
│   │   │   │   ├── AppDbContext.cs
│   │   │   │   ├── Migrations/
│   │   │   │   └── Repositories/
│   │   │   ├── Services/       # Implementations for IEmailService, IFileStorageService (S3), Payment (Stripe)
│   │   │   └── Cache/          # Redis client implementation
│   │   └── MixWarz.API/        # Presentation Layer: API Controllers, Middleware, Startup/Program.cs
│   │       ├── Controllers/
│   │       ├── Middleware/
│   │       ├── Extensions/     # Service registration extensions
│   │       ├── Program.cs
│   │       └── appsettings.json
│   ├── tests/
│   │   ├── MixWarz.Domain.Tests/
│   │   ├── MixWarz.Application.Tests/
│   │   ├── MixWarz.Infrastructure.Tests/
│   │   └── MixWarz.API.Tests/      # Integration tests for API endpoints
│   ├── Dockerfile
│   └── README.md                 # Backend specific README
├── frontend/                   # React Frontend Application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── App.tsx             # Main application component, router setup
│   │   ├── index.tsx           # Entry point, renders App
│   │   ├── reportWebVitals.ts
│   │   ├── setupTests.ts
│   │   ├── assets/             # Static assets (images, fonts)
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Generic UI elements (Button, Input, Modal)
│   │   │   └── layout/         # Page layout components (Header, Footer, Sidebar)
│   │   ├── features/           # Feature-specific modules/components
│   │   │   ├── auth/           # Login, Register components, auth service
│   │   │   ├── competitions/   # Competition list, detail, submission form components
│   │   │   ├── ecommerce/      # Product list, detail, cart, checkout components
│   │   │   ├── user/           # User profile, orders, submissions components
│   │   │   └── admin/          # Admin panel components
│   │   │   └── organizer/      # Organizer specific components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions, Axios instance configuration
│   │   ├── pages/              # Top-level route components (composed from features)
│   │   ├── routes/             # Route definitions, protected route logic
│   │   ├── services/           # API service calls (wrappers around Axios, often using React Query)
│   │   ├── store/              # Global client-side state (e.g., Zustand or Context for UI state)
│   │   ├── styles/             # Global styles, MUI theme configuration
│   │   │   └── theme.ts
│   │   └── types/              # TypeScript type definitions for frontend
│   ├── tests/                  # Jest/RTL tests
│   │   ├── __mocks__/
│   │   ├── components/
│   │   └── features/
│   ├── .env.development
│   ├── .env.production
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md                 # Frontend specific README
├── .dockerignore
├── .editorconfig
├── .env.example                # Example environment variables for local dev (backend focused)
├── .gitignore
├── docker-compose.yml          # For local development environment (API, DB, Cache)
└── README.md                   # Main project README