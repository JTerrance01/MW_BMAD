# MixWarz Brownfield Enhancement Architecture

## Introduction

This document outlines the architectural approach for enhancing MixWarz with the Hybrid Fair-Play Tournament Model. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing system.

**Relationship to Existing Architecture:**
This document supplements existing project architecture by defining how new components will integrate with current systems. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

### Existing Project Analysis

* **Current Project State:**
    * **Primary Purpose:** An audio mixing competition platform.
    * **Current Tech Stack:** .NET 6+, ASP.NET Core, C#, Entity Framework Core.
    * **Architecture Style:** N-Tier/Layered Architecture (API, Services, Data).
    * **Deployment Method:** Standard ASP.NET Core deployment.
* **Available Documentation:** In-code documentation and project structure analysis.
* **Identified Constraints:** Must maintain backward compatibility for non-tournament features.

### Change Log
| Change | Date | Version | Description | Author |
| --- | --- | --- | --- | --- |
| Initial Draft | 2025-08-15 | 1.0 | First draft of the architecture. | Architect |

## Enhancement Scope and Integration Strategy

* **Enhancement Type:** Major Feature Modification & Refactoring.
* **Scope:** Complete replacement of the existing tournament progression logic.
* **Integration Impact:** Significant, touching data models, business logic, and the API layer.
* **Integration Approach:**
    * **Code Integration:** A "strangler fig pattern" will be used, building new services alongside old ones and creating new, versioned API endpoints (`/api/v2/`).
    * **Database Integration:** Changes will be additive, managed via a single, non-destructive EF Core migration.
    * **API Integration:** New endpoints will be versioned to prevent conflicts.

## Tech Stack Alignment

The enhancement will fully align with the existing technology stack. No new technologies will be introduced.

| Category | Current Technology | Version | Usage in Enhancement |
| :--- | :--- | :--- | :--- |
| **Language** | C# | ~10.0 | All new code will be in C#. |
| **Runtime** | .NET | ~6.0+ | Will run within the existing runtime. |
| **Framework**| ASP.NET Core | ~6.0+ | New API endpoints will match existing patterns. |
| **Database** | EF Core | ~6.0+ | Schema changes managed via EF Core Migrations. |
| **API Style**| REST | - | New endpoints will follow established RESTful conventions. |
| **Testing** | xUnit/MSTest | - | New tests will use the existing framework. |

## Data Models and Schema Changes

* **New Models:** `Judgement`, `FeedbackRating`.
* **Amended Models:** `Competitor` (add `JudgingProwessScore`), `Submission` (add `SubmissionStatus` enum).
* **Schema Integration:**
    * A single, non-destructive EF Core migration will be created.
    * **New Tables:** `Judgements`, `FeedbackRatings`.
    * **Modified Tables:** `Submissions` (add `Status` column), `Competitors` (add `JudgingProwessScore` column).

## Component Architecture

* **New Components:**
    * `TournamentLifecycleService`: Manages the state machine of a competition, triggered by scheduled jobs.
    * `SubmissionAssignmentService`: Handles the logic for assigning submissions to judges.
    * `JudgingService`: Manages the user actions of submitting and rating judgments.
    * `JudgingProwessCalculator`: A dedicated utility to calculate judging skill.
    * `HybridTournamentsController`: The new API gateway for all v2 endpoints.
* **Component Interaction Diagram:**
    ```mermaid
    sequenceDiagram
        participant ScheduledJobRunner
        participant TournamentLifecycleService
        participant SubmissionAssignmentService
        participant AppDbContext / Repositories

        Note over ScheduledJobRunner: Competition's SubmissionDeadline passes
        ScheduledJobRunner->>+TournamentLifecycleService: StartUniversalJudging(competitionId)
        TournamentLifecycleService->>+SubmissionAssignmentService: CreateAssignments(competitionId)
        SubmissionAssignmentService->>AppDbContext / Repositories: Save new Judging Assignments
        SubmissionAssignmentService-->>-TournamentLifecycleService: Assignments Created
        TournamentLifecycleService->>AppDbContext / Repositories: Update Competition.Status to 'Judging'
        TournamentLifecycleService-->>-ScheduledJobRunner: Process Complete
    ```

## API Design and Integration

* **New API Endpoints (under `/api/v2/`):**
    * `POST /api/v2/competitions/{id}/start-judging`
    * `POST /api/v2/submissions/{submissionId}/judgements`
    * `POST /api/v2/judgements/{judgementId}/rate`
* **Authentication:** Endpoints will be protected by the existing authentication scheme.

## External API Integration

No new external API integrations are required.

## Source Tree Integration

* **New Files:**
    ```plaintext
    src/
    ├── MixWarz.Domain/
    │   ├── Entities/
    │   │   ├── Judgement.cs
    │   │   └── FeedbackRating.cs
    │   └── Enums/
    │       └── SubmissionStatus.cs
    │
    ├── MixWarz.Infrastructure/
    │   └── Services/
    │       ├── TournamentLifecycleService.cs
    │       ├── SubmissionAssignmentService.cs
    │       ├── JudgingService.cs
    │       └── JudgingProwessCalculator.cs
    │
    └── MixWarz.API/
        └── Controllers/
            └── v2/
                └── HybridTournamentsController.cs
    ```