# MixWarz

MixWarz is a platform for music producers to compete in mixing and mastering competitions.

## Project Structure

The solution follows Clean Architecture principles:

- **MixWarz.Domain**: Contains business entities, interfaces, and domain logic
- **MixWarz.Application**: Contains application logic, commands, queries, and DTOs
- **MixWarz.Infrastructure**: Contains implementations of interfaces defined in Domain, external services, and data access
- **MixWarz.API**: Web API presentation layer for the application

## Getting Started

### Prerequisites

- .NET 9 SDK
- PostgreSQL (or Docker for containerized setup)
- Docker and Docker Compose (for containerized setup)

### Development Environment Setup

#### Option 1: Local Development

1. Install PostgreSQL and Redis on your local machine
2. Update the connection string in `appsettings.Development.json` if needed
3. Run the application from the src/MixWarz.API directory:

```bash
cd src/MixWarz.API
dotnet run
```

#### Option 2: Docker Compose (Recommended)

The easiest way to run the application with all dependencies is using Docker Compose:

1. From the root of the repository run:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database
- Redis cache
- MixWarz API

2. The API will be available at:

   - HTTP: http://localhost:5000
   - HTTPS: https://localhost:5001

3. To stop the containers:

```bash
docker-compose down
```

4. To remove volumes (database data) as well:

```bash
docker-compose down -v
```

### Database Migrations

The application uses Entity Framework Core for database operations. The repository includes migration files for database setup.

#### Latest Migration Information

The most recent migration adds a `MultitrackZipUrl` column to the `Competitions` table:

- Migration File: `20250517000000_AddMultitrackZipUrlToCompetition.cs`
- Changes: Adds a nullable string column `MultitrackZipUrl` to store paths to multitrack zip files for competitions

To apply this migration manually, execute the following SQL against your database:

```sql
ALTER TABLE "Competitions" ADD "MultitrackZipUrl" text NULL;
```

### API Documentation

Once the application is running, you can access the Swagger documentation at:

- http://localhost:5000/swagger (Docker)
- https://localhost:7219/swagger (Local development)

## Authentication

The API uses JWT (JSON Web Token) authentication. To use protected endpoints:

1. Register a user via the `/api/auth/register` endpoint
2. Login via the `/api/auth/login` endpoint to get a JWT token
3. Include the token in the Authorization header of requests to protected endpoints:
   - `Authorization: Bearer {your_token_here}`

## Role-Based Authorization

The system has three roles:

- Admin
- User
- Organizer

Different endpoints require different roles for access.
