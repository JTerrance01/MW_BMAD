# Project Brief

## Project Name

MixWarz

## Core Requirements

- Create a web application for hosting mix competitions for audio engineers and music producers
- Develop an e-commerce marketplace for digital music production goods
- Support three core user roles: Admin, User, and Organizer
- Implement secure audio file submission and storage
- Enable payment processing for e-commerce transactions

## Goals

- [x] Launch a functional platform that allows users to participate in mixing competitions
- [x] Enable users to purchase digital music production goods
- [x] Establish a system that supports Admin, User, and Organizer roles
- [x] Validate the core value proposition of combining skill-based competition with e-commerce
- [ ] Gather user feedback to inform future development phases

## Scope

- [x] User registration and authentication (JWT-based)
- [x] Competition creation, submission, and judging process
- [x] E-commerce functionality for digital goods (catalog, cart, checkout)
- [x] Admin interface for user, competition, and product management
- [x] Integration with payment gateway (Stripe)
- [x] AWS-based infrastructure and hosting

## Notes

- Built using React frontend with Material-UI components
- Backend using .NET Core Web API with Clean Architecture principles
- PostgreSQL database hosted on AWS RDS
- Redis for caching hosted on AWS ElastiCache
- Containerized using Docker, deployed on AWS ECS with Fargate
