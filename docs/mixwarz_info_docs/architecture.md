# MixWarz Architecture Document

## Technical Summary

MixWarz is a web application designed for the music production community, offering mix competitions and an e-commerce marketplace for digital goods. The architecture is a modular monolithic system built on a .NET Core Web API backend following Clean Architecture principles, and a React frontend. Key technologies include PostgreSQL for the primary database, Redis for caching and real-time features like leaderboards, and AWS for hosting. The system emphasizes scalability, security, and maintainability, with a clear separation of concerns to support distinct competition and e-commerce functionalities. Deployment will be container-based using Docker on AWS ECS with Fargate, with static frontend assets served via S3 and CloudFront.

Reference the goals from the PRD:
* Launch a functional platform that allows users to participate in mixing competitions.
* Enable users to purchase digital music production goods.
* Establish a foundational system for three core user roles: Admin, User, and Organizer.

## High-Level Overview

The main architectural style is a modular monolith with a distinct frontend and backend. The frontend (React SPA) interacts with the backend (.NET Core Web API) via RESTful APIs. The backend handles business logic, data persistence (PostgreSQL), caching (Redis), and interactions with third-party services (Stripe for payments, AWS SES for email, AWS S3 for file storage). Users access the application through web browsers.

```mermaid
graph TD
    User[<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/user.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/user.svg)' width='20' height='20'> User/Browser] -- HTTPS --> ALB[<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws.svg)' width='20' height='20'> AWS ALB];

    subgraph "AWS Cloud"
        ALB --> FrontendStatic{{"<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-s3.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-s3.svg)' width='20' height='20'> React Frontend (S3/CloudFront)"}};
        ALB --> BackendAPI[<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-ecs.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-ecs.svg)' width='20' height='20'> .NET Core Web API (ECS Fargate)];

        BackendAPI -- CRUD Ops --> DB[(<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/postgresql.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/postgresql.svg)' width='20' height='20'> PostgreSQL on RDS)];
        BackendAPI -- Cache/Session/Leaderboards --> Cache[(<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redis.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/redis.svg)' width='20' height='20'> Redis on ElastiCache)];
        BackendAPI -- File Storage --> S3Storage[<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-s3.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-s3.svg)' width='20' height='20'> AWS S3 (Submissions, Products)];
        BackendAPI -- Payments --> Stripe[<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/stripe.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/stripe.svg)' width='20' height='20'> Stripe API];
        BackendAPI -- Emails --> SES[<img src='[https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-ses.svg](https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/aws-ses.svg)' width='20' height='20'> AWS SES];
    end

    User --> FrontendStatic;
	
	