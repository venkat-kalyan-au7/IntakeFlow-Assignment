# IntakeFlow

IntakeFlow is a configurable request intake and approval application. Administrators build and publish forms, requesters complete and submit them, and reviewers approve or reject the submitted requests.

This guide explains how to run the project locally, manage its database, test it, deploy it, and understand its architecture. It assumes no previous experience with this repository.

## Contents

- [Application features](#application-features)
- [Technology](#technology)
- [Quick local setup with Docker](#quick-local-setup-with-docker)
- [Local sample accounts and data](#local-sample-accounts-and-data)
- [Developer setup](#developer-setup)
- [Database setup and migrations](#database-setup-and-migrations)
- [Running tests](#running-tests)
- [Deployed application](#deployed-application)
- [Deploying your own copy](#deploying-your-own-copy)
- [Architecture](#architecture)
- [Key design decisions](#key-design-decisions)
- [Troubleshooting](#troubleshooting)

## Application features

### Administrator

- Creates forms without changing code
- Adds text, number, date, and dropdown fields
- Marks fields as required or optional
- Reorders fields and previews the form
- Saves, edits, publishes, and archives forms

### Requester

- Sees published forms
- Saves incomplete requests as drafts
- Submits completed requests
- Views request status and activity history
- Corrects and resubmits rejected requests

### Reviewer

- Sees submitted requests in a review queue
- Searches and filters the queue
- Approves valid requests
- Rejects requests with a required explanation
- Views the complete decision history

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Angular 22.1, TypeScript, RxJS |
| Backend | Spring Boot 4.1.1, Java 25 |
| Security | Spring Security, JWT, BCrypt |
| Database | MySQL 8.4 |
| Migrations | Flyway |
| Packaging | Multi-stage Docker image |
| Production hosting | Render |
| Production database | Aiven MySQL |

## Quick local setup with Docker

This is the recommended option for a beginner. Docker starts MySQL and the complete application.

### 1. Install Docker

Install Docker Desktop from https://www.docker.com/products/docker-desktop/ and wait until it reports that Docker is running.

Linux users can install Docker Engine and the Docker Compose plugin instead.

### 2. Download the project

If Git is installed:

~~~powershell
git clone https://github.com/venkat-kalyan-au7/IntakeFlow-Assignment.git
cd IntakeFlow-Assignment
~~~

You can also download the repository as a ZIP from GitHub, extract it, and open a terminal in the extracted folder.

### 3. Start the application

Run this from the repository root, where compose.yaml is located:

~~~powershell
docker compose up --build
~~~

The first run takes longer because Docker downloads the required images and builds the application. Wait until the logs say that IntakeFlow has started.

Open:

- Application: http://localhost:8080
- Health check: http://localhost:8080/actuator/health
- Local API documentation: http://localhost:8080/api-docs

### 4. Stop the application

Press Ctrl+C in the terminal and then run:

~~~powershell
docker compose down
~~~

The database is kept in a Docker volume, so your local data remains available the next time you start the application.

## Local sample accounts and data

Docker Compose enables local demo data. All local accounts use this password:

    IntakeFlow@2026

| Role | Email |
| --- | --- |
| Administrator | admin@intakeflow.demo |
| Requester | requester@intakeflow.demo |
| Reviewer | reviewer@intakeflow.demo |

The local seed also includes a published vendor onboarding form and requests in submitted, approved, and rejected states.

These accounts and records are for local development only. They are disabled in the deployed production application.

## Developer setup

Use this option while changing code. MySQL runs in Docker, while Spring Boot and Angular run directly on your computer.

### Prerequisites

Install:

- Docker Desktop
- Java Development Kit 25
- Node.js 24 LTS with npm

Confirm each installation:

~~~powershell
docker --version
java --version
node --version
npm --version
~~~

### 1. Start only MySQL

From the repository root:

~~~powershell
docker compose up -d database
~~~

Local database connection:

| Setting | Value |
| --- | --- |
| Host | localhost |
| Port | 3306 |
| Database | intakeflow |
| Username | intakeflow |
| Password | intakeflow |

These credentials are only for the local Docker database.

### 2. Start the backend

Open a new terminal.

Windows:

~~~powershell
cd backend
.\mvnw.cmd spring-boot:run
~~~

macOS or Linux:

~~~bash
cd backend
chmod +x mvnw
./mvnw spring-boot:run
~~~

The backend runs at http://localhost:8080. It connects to the local MySQL container using the default development settings. Flyway applies pending migrations automatically.

### 3. Start the frontend

Open another terminal:

~~~powershell
cd frontend
npm ci
npm start
~~~

Open http://localhost:4200. The Angular server forwards API requests to http://localhost:8080 using frontend/proxy.conf.json.

### 4. Enable sample data for direct backend development

Docker Compose enables sample data automatically. When starting Spring Boot directly, set APP_DEMO_MODE first.

Windows PowerShell:

~~~powershell
$env:APP_DEMO_MODE="true"
.\mvnw.cmd spring-boot:run
~~~

macOS or Linux:

~~~bash
export APP_DEMO_MODE=true
./mvnw spring-boot:run
~~~

Never enable APP_DEMO_MODE in production.

## Database setup and migrations

### Local database creation

The database service in compose.yaml creates:

- A database named intakeflow
- A user named intakeflow
- A persistent volume named intakeflow_data

The application waits for the MySQL health check before it starts.

### How migrations work

Flyway owns the schema. Migration files are stored in:

    backend/src/main/resources/db/migration

The initial migration is:

    V1__initial_schema.sql

At every backend startup, Flyway:

1. Connects to MySQL.
2. Reads the flyway_schema_history table.
3. Checks which migrations were already applied.
4. Applies only new migrations in version order.
5. Stops startup if validation or migration fails.

Hibernate uses ddl-auto=validate. It checks that the Java entities match the migrated schema, but it does not create or silently modify tables.

### Adding a migration

Never change a migration that has already run on a shared database. Add a new file using the next version:

    V2__add_submission_priority.sql

Use one version number, two underscores, and a clear description. Restart the backend to apply it.

### Viewing migration logs

~~~powershell
docker compose logs application
~~~

Successful startup contains messages similar to:

    Successfully validated 1 migration
    Successfully applied 1 migration

### Resetting the local database

The following command permanently deletes all local IntakeFlow records and rebuilds a new database:

~~~powershell
docker compose down -v
docker compose up --build
~~~

The -v option deletes only the local Docker volume. It does not affect the deployed Aiven database.

### Using a separately installed MySQL server

Create a database and user in MySQL 8.4:

~~~sql
CREATE DATABASE intakeflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'intakeflow'@'localhost' IDENTIFIED BY 'choose-a-local-password';
GRANT ALL PRIVILEGES ON intakeflow.* TO 'intakeflow'@'localhost';
FLUSH PRIVILEGES;
~~~

Set the connection values before starting Spring Boot.

Windows PowerShell:

~~~powershell
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/intakeflow?serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false"
$env:SPRING_DATASOURCE_USERNAME="intakeflow"
$env:SPRING_DATASOURCE_PASSWORD="choose-a-local-password"
$env:JWT_SECRET="local-development-secret-change-before-production-32chars"
.\mvnw.cmd spring-boot:run
~~~

Do not commit real passwords to .env.example, compose.yaml, application.yml, or Git.

## Running tests

### Backend

Windows:

~~~powershell
cd backend
.\mvnw.cmd test
~~~

macOS or Linux:

~~~bash
cd backend
./mvnw test
~~~

### Frontend

~~~powershell
cd frontend
npm ci
npm test -- --watch=false
npm run build
~~~

### Production image

From the repository root:

~~~powershell
docker build -t intakeflow:local .
~~~

### Full role and workflow test

First start the local Docker application:

~~~powershell
docker compose up --build
~~~

In a second terminal:

~~~powershell
node scripts/test-role-workflows.mjs
~~~

This script tests authentication, authorization, form CRUD, publishing, drafts, validation edge cases, submission, approval, rejection, resubmission, search, pagination, archiving, and all role dashboards. It creates temporary records and archives the forms it creates.

## Deployed application

The current deployment is available at:

https://intakeflow.onrender.com

| Component | Provider |
| --- | --- |
| Web application and API | Render Web Service |
| MySQL 8.4 database | Aiven |
| Source repository | GitHub |

### Production accounts

The first successful production startup creates:

| Role | Email |
| --- | --- |
| Administrator | admin@intakeflow.app |
| Requester | requester@intakeflow.app |
| Reviewer | reviewer@intakeflow.app |

Production passwords are Render secrets and are intentionally not stored in this repository. Obtain them from the project owner through a secure channel.

### Production verification

- Readiness endpoint: https://intakeflow.onrender.com/actuator/health/readiness
- Expected response: {"status":"UP"}
- Public Swagger UI is disabled
- Public OpenAPI JSON is disabled
- Demo accounts and sample records are disabled

Render and Aiven free services can sleep after inactivity. The first request can take approximately 50 seconds or longer while they wake up.

## Deploying your own copy

The repository contains render.yaml, which defines one free Render Web Service built from the root Dockerfile.

### 1. Push the project to GitHub

Create a GitHub repository and push this project. Confirm that render.yaml and Dockerfile exist at the repository root.

### 2. Create Aiven MySQL

1. Create an Aiven account and project.
2. Create a MySQL 8.4 service.
3. Choose a suitable region and plan.
4. Wait until its status is Running.
5. Open Connection information.
6. Record the host, port, database, username, and password.
7. Keep SSL mode set to REQUIRED.

Create the JDBC URL:

    jdbc:mysql://HOST:PORT/DATABASE_NAME?sslMode=REQUIRED&serverTimezone=UTC

Example structure:

    jdbc:mysql://example.aivencloud.com:12345/defaultdb?sslMode=REQUIRED&serverTimezone=UTC

Never put the real Aiven password in GitHub.

### 3. Create a Render Blueprint

1. Sign in to Render.
2. Open Blueprints.
3. Select New Blueprint Instance.
4. Connect the GitHub repository or enter its public URL.
5. Select the branch containing render.yaml, normally main.
6. Enter a Blueprint name.
7. Supply all requested secret values.
8. Select Deploy Blueprint.

### 4. Enter required Render secrets

| Environment variable | Value |
| --- | --- |
| SPRING_DATASOURCE_URL | Aiven JDBC URL |
| SPRING_DATASOURCE_USERNAME | Aiven username |
| SPRING_DATASOURCE_PASSWORD | Aiven password |
| APP_BOOTSTRAP_ADMIN_PASSWORD | Unique password of at least 12 characters |
| APP_BOOTSTRAP_REQUESTER_PASSWORD | Different password of at least 12 characters |
| APP_BOOTSTRAP_REVIEWER_PASSWORD | Different password of at least 12 characters |

render.yaml supplies:

- APP_DEMO_MODE=false
- SPRINGDOC_API_DOCS_ENABLED=false
- SPRINGDOC_SWAGGER_UI_ENABLED=false
- The three bootstrap account emails
- A generated JWT_SECRET

### 5. First-deployment sequence

1. Render builds Angular.
2. Angular files are copied into the Spring Boot application.
3. Render starts one Java container.
4. Spring Boot connects to Aiven over TLS.
5. Flyway validates and applies migrations.
6. The bootstrap initializer creates missing production accounts.
7. BCrypt hashes the passwords before database storage.
8. Render checks /actuator/health/readiness and marks the deployment live.

Bootstrap accounts are created only when their email does not already exist. Changing a bootstrap password variable later does not change the password of an existing database account.

### 6. Verify production

1. Open the Render URL.
2. Confirm /actuator/health/readiness reports UP.
3. Sign in with each role.
4. Confirm /api-docs returns 404.
5. Confirm /api/openapi returns 404.
6. Check Render logs for database or migration errors.

## Architecture

~~~text
Browser
  |
  | HTTPS
  v
Render: one Spring Boot container
  |-- Angular static frontend
  |-- REST API under /api/v1
  |-- JWT authentication and role authorization
  |-- Validation and workflow services
  |-- Flyway migrations
  |
  | TLS JDBC
  v
Aiven: MySQL 8.4
~~~

### Frontend

Angular provides the interface, routing, forms, role-specific navigation, loaders, and top-center toast messages. Route guards hide pages that a role cannot use.

### Backend

Spring Boot owns authentication, authorization, validation, form versioning, state transitions, and audit history. The backend verifies every request even when the frontend hides an unavailable action.

### Database

MySQL stores users, form definitions, immutable form versions, fields, dropdown options, submissions, answers, and workflow events.

See docs/architecture.md for the detailed domain model and workflow.

## Key design decisions

### One production container

Angular is compiled and served by Spring Boot. The UI and API use the same domain, avoiding production CORS complexity and frontend/backend version drift.

### Versioned published forms

A published form is never edited in place. Later changes produce a new version while existing submissions retain the exact version originally completed.

### Backend-controlled workflow

The frontend shows only relevant actions, but Spring Boot enforces roles and transitions. A requester cannot approve, a reviewer cannot edit answers, and reviewers cannot see unsubmitted drafts.

### Flyway-managed schema

Database changes are explicit, ordered, repeatable, and reviewable. Hibernate validates the schema instead of changing it automatically.

### Append-only audit history

Meaningful transitions create WorkflowEvent records, preserving submission, approval, rejection, and resubmission history.

### Optimistic locking

Submission version values prevent simultaneous updates from silently overwriting each other.

### Runtime secrets

Database passwords, account passwords, and the JWT signing key come from Render environment variables and are not committed to source control.

## Project structure

~~~text
backend/                         Spring Boot API and tests
  src/main/java/                Controllers, services, security, domain
  src/main/resources/
    db/migration/               Flyway SQL migrations
frontend/                        Angular application and tests
scripts/                         Full API workflow test
docs/                            Detailed architecture notes
compose.yaml                     Local MySQL and application
Dockerfile                       Production multi-stage image
render.yaml                      Render Blueprint
.env.example                     Environment variable reference
~~~

## Troubleshooting

### Port 8080 or 3306 is already used

Stop the program using that port or stop previous IntakeFlow containers:

~~~powershell
docker compose down
~~~

### MySQL is unhealthy

~~~powershell
docker compose logs database
docker compose down
docker compose up --build
~~~

### The backend cannot connect to MySQL

~~~powershell
docker compose ps
~~~

When Spring Boot runs directly on your computer, the database host is localhost. Inside Docker Compose, the host is database.

### Local login fails

Confirm APP_DEMO_MODE is true and use an email ending in @intakeflow.demo. Production emails ending in @intakeflow.app are separate.

### The deployed site is initially slow

Free services may be sleeping. Wait for Render and Aiven to wake up and retry.

### Production API documentation returns 404

This is intentional. Swagger and OpenAPI are available locally and disabled by render.yaml in production.
