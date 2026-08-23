# IntakeFlow

IntakeFlow is a role-based request intake and approval system. Administrators publish structured forms, requesters submit work against a specific form version, and reviewers make auditable decisions without losing the history of what was submitted.

[![Production](https://img.shields.io/badge/production-live-16a34a?style=flat-square)](https://intakeflow.onrender.com)
![Angular](https://img.shields.io/badge/Angular-22.1-dd0031?style=flat-square&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6db33f?style=flat-square&logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479a1?style=flat-square&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white)

Live application: **https://intakeflow.onrender.com**

## Contents

- [What the system does](#what-the-system-does)
- [Run locally](#run-locally)
- [Role walkthroughs](#role-walkthroughs)
- [Local runtime](#local-runtime)
- [Database lifecycle](#database-lifecycle)
- [Design decisions](#design-decisions)
- [Code architecture and patterns](#code-architecture-and-patterns)
- [Production setup](#production-setup)
- [Troubleshooting](#troubleshooting)

## What the system does

The product has three deliberately narrow roles:

| Role | Responsibility |
| --- | --- |
| Administrator | Designs, publishes and archives reusable intake forms |
| Requester | Saves drafts, submits requests and responds to rejected work |
| Reviewer | Reviews submitted requests and records approval or rejection decisions |

The API owns authorization and workflow transitions. The Angular application shows only the actions relevant to the current user, but it is not trusted to enforce security.

```text
Administrator publishes a form
              |
              v
Requester saves a draft and submits it
              |
              v
Reviewer approves --------------------> APPROVED
              |
              +---- rejects with comment
                            |
                            v
                         REJECTED
                            |
                            +---- requester edits and resubmits ----> SUBMITTED
```

| Status | Meaning |
| --- | --- |
| 🟡 `DRAFT` | Requester can continue editing |
| 🔵 `SUBMITTED` | Waiting for a reviewer decision |
| 🟢 `APPROVED` | Review completed successfully |
| 🔴 `REJECTED` | Requester must review the comment and resubmit |

## Run locally

Docker Desktop is the only local prerequisite. Java, Node.js, Maven and MySQL are provided by the build and runtime containers.

### 1. Get the source

```powershell
git clone https://github.com/venkat-kalyan-au7/IntakeFlow-Assignment.git
cd IntakeFlow-Assignment
```

If the repository was downloaded as a ZIP, extract it and open a terminal in the directory containing `compose.yaml`.

### 2. Start the stack

Make sure Docker Desktop is running, then execute:

```powershell
docker compose up --build
```

The first build downloads the base images and may take several minutes. Compose starts MySQL first, waits for its health check, then starts IntakeFlow. The application is ready when the logs report that `IntakeFlowApplication` has started.

Open:

- Application: http://localhost:8080
- Health check: http://localhost:8080/actuator/health

A healthy application returns:

```json
{"status":"UP"}
```

### 3. Sign in

Local accounts share the password `IntakeFlow@2026`.

| Role | Email |
| --- | --- |
| Administrator | `admin@intakeflow.demo` |
| Requester | `requester@intakeflow.demo` |
| Reviewer | `reviewer@intakeflow.demo` |

The local seed also includes a published vendor-onboarding form and requests in submitted, approved and rejected states. These records exist only in the Docker environment; production does not load the local seed.

### 4. Stop or restart

Stop the containers without deleting data:

```powershell
docker compose down
```

Start the existing environment again:

```powershell
docker compose up
```

To discard the local database and recreate the seeded environment:

```powershell
docker compose down -v
docker compose up --build
```

`docker compose down -v` deletes the project’s local MySQL volume. It has no effect on the Aiven database used by the deployed application.

## Role walkthroughs

### Administrator

1. Open **Form Studio** and create a form.
2. Add text, number, date or dropdown fields.
3. Set labels, help text, required rules and dropdown options.
4. Reorder fields and confirm the live preview.
5. Save the draft, reopen it and publish it.
6. Archive the form when it should stop accepting new requests.

Publishing creates an immutable form version. Later edits produce another version, so existing submissions continue to render against the schema used when they were created.

### Requester

1. Open **Requests** and select a published form.
2. Enter partial information and save a draft.
3. Reopen the draft and complete the required fields.
4. Submit the request and retain its reference number.
5. Track the request from its detail page.
6. If it is rejected, review the comment, correct the answers and resubmit.

### Reviewer

1. Open **Review Queue**.
2. Search or filter the submitted requests.
3. Open a request and inspect its versioned answers and history.
4. Approve it, or reject it with a meaningful comment.

Only requests in `SUBMITTED` state can be reviewed. The backend validates that rule even if a client calls the API directly.

## Local runtime

`compose.yaml` defines two services:

| Service | Purpose |
| --- | --- |
| `database` | MySQL 8.4, persisted in the `intakeflow_data` Docker volume |
| `application` | The production-style Spring Boot image, exposed on port 8080 |

The image is built in stages:

1. Node installs the pinned frontend dependencies and produces the Angular bundle.
2. Maven compiles the backend and packages the frontend under Spring Boot’s static resources.
3. A smaller Java runtime image runs the resulting JAR.

The running container does not contain Node, Angular CLI, Maven or the Java compiler. Frontend and API are served from the same origin, which removes cross-origin configuration from the authentication path and keeps the deployed artifacts in lockstep.

| Local port | Service |
| --- | --- |
| `8080` | Web application, API and health endpoints |
| `3306` | MySQL, exposed for local inspection |

## Database lifecycle

MySQL stores users, form definitions, immutable form versions, fields, dropdown options, submissions, answers and workflow events.

The core relationships are:

- `FormDefinition` provides the stable identity of a form.
- `FormVersion` stores a draft or published snapshot.
- `FormField` and `FieldOption` describe the versioned schema.
- `Submission` references the exact published version completed by a requester.
- `SubmissionAnswer` stores the value for a versioned field.
- `WorkflowEvent` records each meaningful state transition and review comment.

Flyway is the only component allowed to evolve the schema. On startup it validates `flyway_schema_history` and applies any migration that has not run. The initial migration is located at:

```text
backend/src/main/resources/db/migration/V1__initial_schema.sql
```

Hibernate runs with `ddl-auto=validate`; it verifies the entity-to-table mapping but never changes production tables. A migration error therefore stops startup instead of allowing the application and schema to drift.

## Design decisions

### Version published forms instead of mutating them

A submission must remain understandable after an administrator changes a form. Each submission therefore points to an immutable published version rather than the current form definition.

### Enforce state transitions in the service layer

Route guards and conditional buttons improve usability, but the API independently checks role, ownership and current state. This prevents stale clients and direct API calls from bypassing workflow rules.

### Keep an append-only workflow history

Submission, rejection, resubmission and approval create `WorkflowEvent` records. Earlier events are retained, including the actor, timestamp, status change and review comment.

### Use explicit migrations

Flyway makes schema changes reviewable and repeatable. Hibernate validation catches mismatches without making implicit production changes.

### Prevent silent concurrent writes

Submission records use optimistic locking. Two users cannot update the same request concurrently and silently overwrite each other.

### Ship one production artifact

Serving Angular from Spring Boot gives the browser one origin and gives operations one versioned artifact to promote or roll back.

The deeper domain and security model is documented in [docs/architecture.md](docs/architecture.md).

## Code architecture and patterns

The codebase follows a layered backend architecture and a feature-oriented frontend structure. Each layer has a narrow responsibility, which keeps workflow rules testable and prevents HTTP, persistence and presentation concerns from leaking into one another.

### Backend layers

```text
HTTP request
    |
    v
Controller  -> request validation, role boundary and response contract
    |
    v
Service     -> authorization, transactions and workflow rules
    |
    v
Repository  -> database queries and pagination
    |
    v
Domain      -> entities, relationships, status and role types
```

- **Controllers** expose the REST contract under `/api/v1`. They accept typed request models, apply method-level role checks and delegate business work.
- **Services** form the application layer. `FormService` and `SubmissionService` own transactions, authorization checks, form versioning and valid workflow transitions.
- **Repositories** use Spring Data JPA for persistence, focused queries, search and bounded pagination.
- **Domain entities** model users, form versions, fields, submissions, answers and workflow events. Enums make roles, field types and statuses explicit.
- **API models and mapping** keep persistence entities out of the public response contract. `ApiMapper` converts domain objects into stable DTOs.
- **Global exception handling** translates validation, authorization, conflict and not-found failures into consistent HTTP responses.

This is a conventional Controller–Service–Repository pattern with a domain model at its centre. Transaction boundaries live in the service layer, while repositories remain concerned only with data access.

### Frontend structure

```text
app/
  core/       authentication, API client, guards, interceptor and feedback state
  features/   login, dashboard, form studio, requests and review queue
  shared/     application shell, status badges, empty states and toast viewport
```

- Angular standalone components are grouped by business feature rather than by technical file type.
- Route guards handle navigation-level authentication and role visibility.
- `ApiService` is the single typed boundary for backend calls; components do not construct API URLs independently.
- The HTTP interceptor attaches JWT credentials, coordinates global loading state and normalizes common API failures.
- Signals hold local view state such as loading, editing, selection and dialog visibility. Components use `OnPush` change detection to avoid unnecessary rendering.
- Reactive forms provide field-level validation for login and dynamic request entry.
- Shared components centralize recurring status, empty-state and notification behaviour without creating a large generic component framework.

### Workflow pattern

The submission lifecycle is implemented as an explicit state machine in the service layer. Commands such as submit, approve, reject and resubmit validate the current state before changing it. Each successful transition writes a `WorkflowEvent`, so the current state and its audit history are updated in the same transaction.

Frontend conditions mirror those rules to keep the interface clear, but backend checks remain authoritative. This allows the UI to evolve without weakening the workflow or security model.

### Cross-cutting concerns

- JWT authentication is stateless; BCrypt protects stored passwords.
- `@PreAuthorize` establishes role boundaries at API entry points, with ownership checks applied inside services.
- Flyway owns schema changes and Hibernate validates the resulting schema.
- Optimistic locking prevents concurrent submission updates from silently overwriting each other.
- Central loading and toast services give asynchronous operations consistent feedback.

## Production setup

The deployed system uses the same container packaging as the local environment.

```text
Browser
  |
  | HTTPS
  v
Render web service
  |-- Angular static assets
  |-- Spring Boot REST API under /api/v1
  |-- JWT authentication and role authorization
  |-- Flyway migration and readiness checks
  |
  | TLS JDBC
  v
Aiven MySQL 8.4
```

| Component | Platform |
| --- | --- |
| Source | GitHub |
| Application image and runtime | Render |
| Production database | Aiven MySQL 8.4 |

Render builds the root `Dockerfile`, starts the service and waits for the readiness endpoint before routing traffic to the new instance. Spring Boot connects to Aiven using TLS and runs Flyway before accepting application traffic.

Production accounts are provisioned separately from the local seed:

| Role | Email |
| --- | --- |
| Administrator | `admin@intakeflow.app` |
| Requester | `requester@intakeflow.app` |
| Reviewer | `reviewer@intakeflow.app` |

Passwords, the database connection and the JWT signing key are Render environment secrets; none are committed to the repository. Obtain account passwords from the project owner.

The public readiness endpoint is:

https://intakeflow.onrender.com/actuator/health/readiness

Render and Aiven currently run on free plans. After inactivity, the first request can take a minute or longer while the services resume. Subsequent requests run normally.

## Troubleshooting

### Docker is not running

Start Docker Desktop, wait for the engine to become ready, then run `docker compose up --build` again.

### Port 8080 or 3306 is already in use

Stop the process using the port or shut down a previous IntakeFlow stack:

```powershell
docker compose down
```

### MySQL does not become healthy

```powershell
docker compose logs database
```

If the local data can be discarded, recreate the volume with `docker compose down -v` followed by `docker compose up --build`.

### The application container exits

```powershell
docker compose logs application
```

Startup failures normally identify either a database connection problem or a Flyway validation error.

### Local login fails

Use an `@intakeflow.demo` account from the table above and the local password `IntakeFlow@2026`. Production accounts do not work against the local database.

### The deployed application is slow on the first request

Allow the free Render instance to resume, then refresh. Confirm readiness at `/actuator/health/readiness` if the delay continues.
