# MixWarz Testing Strategy

## Overall Philosophy & Goals

The MixWarz testing strategy aims to ensure a high-quality, reliable, and secure application by employing a multi-layered testing approach. We will follow the principles of the Testing Pyramid/Trophy, emphasizing extensive automation to enable rapid feedback, confident refactoring, and continuous delivery.

-   **Goal 1:** Achieve high code coverage (target >80% for Domain and Application layers in backend, >70% for frontend components and key services) for critical modules.
-   **Goal 2:** Prevent regressions in core user functionalities (registration, login, competition submission, product purchase, admin operations).
-   **Goal 3:** Enable confident and safe refactoring of code.
-   **Goal 4:** Ensure tests run efficiently within the CI/CD pipeline to provide quick feedback.
-   **Goal 5:** Validate security, performance, and usability requirements.

## Testing Levels

### Unit Tests

-   **Scope:** Test the smallest isolated pieces of code (individual methods, functions, classes, React components) in isolation from their external dependencies. Focus on business logic, calculations, conditional paths, and component rendering/behavior.
-   **Tools:**
    -   **Backend (.NET Core):** xUnit (test framework), Moq (mocking library).
    -   **Frontend (React):** Jest (test runner, assertions, mocking), React Testing Library (RTL) (for testing component behavior).
-   **Mocking/Stubbing:**
    -   Backend: Moq for interfaces (repositories, external services). EF Core In-Memory Provider can be used for simple data access tests, but repository mocking is preferred for true unit tests.
    -   Frontend: Jest's built-in mocking capabilities (`jest.mock`, `jest.fn()`) for API calls, hooks, or child components.
-   **Location:**
    -   Backend: Separate test projects (e.g., `MixWarz.Domain.Tests/`, `MixWarz.Application.Tests/`).
    -   Frontend: Collocated with source files (e.g., `*.test.ts` or `*.test.tsx`) or in a `__tests__` subfolder within feature/component directories.
-   **Expectations:**
    -   Should cover all significant logic paths and edge cases within a unit.
    -   Fast execution (milliseconds per test).
    -   Form the largest portion of automated tests.
    -   Run automatically on every commit in the CI pipeline.

### Integration Tests

-   **Scope:** Verify the interaction and collaboration between multiple internal components or layers of the application.
    -   **Backend (.NET Core):**
        -   Test interactions between API controllers, application services, and a real test database (e.g., a Dockerized PostgreSQL instance spun up for the test run, or a dedicated test database schema).
        -   Verify that API endpoints behave as expected regarding request handling, response generation, data persistence, and authorization logic.
        -   Test interactions with external service abstractions (e.g., ensuring the file storage service correctly interacts with a mocked S3 or a local S3-compatible store like MinIO).
    -   **Frontend (React):**
        -   Test interactions between multiple components, context providers, routing, and mocked API service layers. For example, test that navigating to a specific route renders the correct page, components interact correctly, and data fetching hooks behave as expected with mocked responses.
-   **Tools:**
    -   **Backend (.NET Core):** xUnit, `WebApplicationFactory` (for in-process API testing), Testcontainers (for managing Dockerized dependencies like PostgreSQL/Redis), Respawn (for resetting database state).
    -   **Frontend (React):** Jest, React Testing Library, MSW (Mock Service Worker) for intercepting and mocking API requests at the network level.
-   **Location:**
    -   Backend: Separate integration test project (e.g., `MixWarz.API.Tests/`).
    -   Frontend: Can be within the existing Jest setup, often in specific `integration` subfolders.
-   **Expectations:**
    -   Focus on module boundaries, contracts, and data flow between components.
    -   Slower than unit tests but faster than E2E tests.
    -   Run automatically in the CI pipeline after unit tests pass.

### End-to-End (E2E) / Acceptance Tests

-   **Scope:** Test the entire system flow from an end-user perspective, simulating real user scenarios. Interact with the application through its UI (React frontend) which in turn calls the live backend API, connected to its database and other services.
-   **Tools:** Playwright (preferred for its speed, reliability, and cross-browser capabilities) or Cypress.
-   **Environment:** Run against a fully deployed staging environment that mirrors production as closely as possible. For critical pre-deployment checks, a subset might run against a locally composed environment using `docker-compose`.
-   **Location:** Separate test project/directory (e.g., `tests/e2e/` at the root or `frontend/tests/e2e/`).
-   **Key Scenarios for MVP:**
    1.  User Registration -> Login -> View Profile.
    2.  User views competitions -> Submits to an open competition -> Views submission status.
    3.  Organizer/Admin logs in -> Creates a competition -> Manages submissions -> Judges a submission -> Publishes results.
    4.  User browses products -> Adds to cart -> Proceeds to checkout -> Completes payment (mocked/test Stripe) -> Views order history -> Accesses digital download.
    5.  Admin logs in -> Manages users (changes role) -> Manages products (adds/edits/toggles active) -> Views all orders.
-   **Expectations:**
    -   Cover critical user paths and business flows ("happy paths" and key negative paths).
    -   Slower and can be more prone to flakiness due to their comprehensive nature.
    -   Run less frequently in CI (e.g., nightly on staging, or before a production deployment triggered manually or on merge to main).

### Manual / Exploratory Testing

-   **Scope:** Utilized for areas difficult to automate effectively or where human intuition is valuable.
    -   Usability testing (especially for new UI/UX).
    -   Exploratory testing to uncover edge cases or unexpected behaviors.
    -   Verifying complex visual elements or interactions.
    -   Testing on a variety of physical devices/browsers if emulation isn't sufficient.
-   **Process:** Conducted by QA testers or development team members before major releases or feature rollouts, based on test plans or checklists. Feedback and bugs logged in an issue tracker.

## Specialized Testing Types

### Security Testing

-   **Scope & Goals:** Identify and mitigate security vulnerabilities.
-   **Tools & Practices:**
    -   **Static Application Security Testing (SAST):** Integrated into CI/CD (e.g., SonarQube, GitHub CodeQL, or .NET-specific analyzers).
    -   **Dependency Scanning:** Tools like `dotnet list package --vulnerable`, `npm audit`, GitHub Dependabot alerts, Snyk. Run regularly in CI.
    -   **Dynamic Application Security Testing (DAST):** Basic scans using tools like OWASP ZAP against the staging environment (Post-MVP or as resources allow).
    -   **Penetration Testing:** Conducted by third-party experts before major public launches or significant updates (Post-MVP).
    -   Regular code reviews with a security focus.

### Performance Testing (Basic for MVP, Expanded Post-MVP)

-   **Scope & Goals (MVP):** Ensure key API endpoints and user flows meet responsiveness NFRs under expected MVP load. Identify obvious bottlenecks.
    -   Key Endpoints: Login, competition list, product list, submission upload, add to cart, create payment intent.
-   **Tools:** k6, JMeter, or AWS Distributed Load Testing solution.
-   **Process (MVP):** Basic load tests against the staging environment before initial launch. More comprehensive performance testing post-MVP.

### Accessibility Testing (UI)

-   **Scope & Goals:** Target WCAG 2.1 Level A as minimum, AA for key elements.
-   **Tools:**
    -   Automated: Axe DevTools browser extension, Jest-axe for unit tests.
    -   Manual: Keyboard navigation checks, screen reader testing (NVDA, VoiceOver) for critical flows.
    -   Linters (ESLint with accessibility plugins).

## Test Data Management

-   **Unit Tests:** Use mocked data or small, controlled in-memory datasets.
-   **Integration Tests (Backend):**
    -   Use a dedicated test database schema/instance.
    -   Seed data programmatically before test runs (e.g., using EF Core seeding or custom scripts).
    -   Clean up data after test runs or reset the database to a known state (e.g., using Respawn or by dropping/recreating schema/Docker container).
-   **E2E Tests:**
    -   Requires a stable set of test data in the staging environment.
    -   May involve creating specific test accounts and data via API setup scripts before test suites run.
    -   Careful management to avoid test interference and ensure repeatability.
-   **Staging Environment:** Should have a representative, anonymized (if from production) dataset. Regular refreshes or synthetic data generation may be needed.

## CI/CD Integration

-   **Unit Tests:** Run on every commit to any branch. Must pass for PR merging.
-   **Integration Tests:** Run on every commit to main development branches (e.g., `develop`, `main`) and on PRs targeting these branches. Must pass for PR merging.
-   **E2E Tests (Subset):** A small subset of critical E2E tests may run on PRs if execution time is acceptable. Full E2E suite runs nightly on staging or before production deployment.
-   **Build Failure:** The CI/CD pipeline will fail if any automated tests (unit, integration, and designated E2E) fail, preventing deployment of faulty code.
-   **Reporting:** Test results and code coverage reports should be published and accessible (e.g., via CodeBuild reports, SonarQube dashboard).

## Change Log

| Change        | Date       | Version | Description                      | Author         |
| ------------- | ---------- | ------- | -------------------------------- | -------------- |
| Initial draft | 2025-05-07 | 0.1     | Initial testing strategy outline | Architect_2    |