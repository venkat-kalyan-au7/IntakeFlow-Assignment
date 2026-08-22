# IntakeFlow

IntakeFlow is a configurable request intake and approval application. It allows a team to create reusable forms, collect structured requests, review submissions, and retain a complete history of every decision.

The application supports three roles:

- **Administrator** creates, publishes, and archives forms.
- **Requester** completes forms and tracks submitted requests.
- **Reviewer** reviews submitted requests and approves or rejects them.

## Contents

- [Application workflow](#application-workflow)
- [Main features](#main-features)
- [Technology](#technology)
- [Run locally with Docker](#run-locally-with-docker)
- [Local login accounts and sample data](#local-login-accounts-and-sample-data)
- [Suggested local test flow](#suggested-local-test-flow)
- [How Docker works in this project](#how-docker-works-in-this-project)
- [How the database works](#how-the-database-works)
- [Deployed application](#deployed-application)
- [Architecture](#architecture)
- [Key design decisions](#key-design-decisions)
- [Troubleshooting](#troubleshooting)

## Application workflow

~~~text
Administrator
    |
    | creates and publishes a form
    v
Requester
    |
    | saves a draft and submits the completed request
    v
Reviewer
    |
    | approves
    +------------------------------> APPROVED
    |
    | rejects with a comment
    v
REJECTED
    |
    | requester edits and resubmits
    v
SUBMITTED
~~~

The backend controls every workflow transition. The interface displays only the actions available to the signed-in role, while the API independently verifies authorization and request state.

## Main features

### Administrator

- Create forms using text, number, date, and dropdown fields
- Mark fields as required or optional
- Reorder fields and view the form preview
- Save and edit draft forms
- Publish forms for requesters
- Archive forms that should no longer accept new requests

### Requester

- View available published forms
- Save incomplete requests as drafts
- Edit and submit completed requests
- View request status and activity history
- Correct and resubmit rejected requests

### Reviewer

- View submitted requests in a review queue
- Search and filter requests
- Inspect all submitted answers
- Approve requests
- Reject requests with a required comment
- View the complete decision history

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Angular 22.1, TypeScript, RxJS |
| Backend | Spring Boot 4.1.1, Java 25 |
| Authentication | Spring Security and JWT |
| Password storage | BCrypt |
| Database | MySQL 8.4 |
| Database migrations | Flyway |
| Local runtime | Docker Compose |
| Production application hosting | Render |
| Production database hosting | Aiven |

## Run locally with Docker

Docker is the only required local dependency. Java, Node.js, npm, Maven, and MySQL do not need to be installed separately.

### 1. Install and start Docker

Install Docker Desktop:

https://www.docker.com/products/docker-desktop/

Open Docker Desktop and wait until Docker reports that it is running.

### 2. Download the repository

Using Git:

~~~powershell
git clone https://github.com/venkat-kalyan-au7/IntakeFlow-Assignment.git
cd IntakeFlow-Assignment
~~~

Alternatively, download the repository ZIP from GitHub, extract it, and open a terminal in the extracted project folder.

The terminal must be at the repository root, where these files are located:

~~~text
compose.yaml
Dockerfile
backend/
frontend/
~~~

### 3. Start the application

~~~powershell
docker compose up --build
~~~

During the first run, Docker downloads the required base images and builds the application. This can take several minutes depending on the network connection.

Docker then:

1. Starts MySQL.
2. Waits for the MySQL health check to pass.
3. Starts the IntakeFlow application.
4. Connects the application to MySQL.
5. Applies the database migration.
6. Loads the local sample accounts and data.

Wait until the application logs report that IntakeFlow has started.

### 4. Open the application

Application:

http://localhost:8080

Health endpoint:

http://localhost:8080/actuator/health

A successful health response contains:

~~~json
{"status":"UP"}
~~~

### 5. Stop the application

Press Ctrl+C in the terminal running Docker Compose, then run:

~~~powershell
docker compose down
~~~

This stops and removes the containers but keeps the local database data.

### 6. Start it again

~~~powershell
docker compose up
~~~

The existing Docker images and stored database are reused, so later starts are normally faster.

## Local login accounts and sample data

All local accounts use the password:

~~~text
IntakeFlow@2026
~~~

| Role | Email |
| --- | --- |
| Administrator | admin@intakeflow.demo |
| Requester | requester@intakeflow.demo |
| Reviewer | reviewer@intakeflow.demo |

The local database also contains:

- A published vendor onboarding form
- A submitted request waiting for review
- An approved request
- A rejected request that can be corrected and resubmitted

The local sample accounts and records exist only because compose.yaml enables demo mode. They are not enabled in the deployed application.

## Suggested local test flow

### 1. Administrator flow

1. Sign in with the Administrator account.
2. Open **Form Studio**.
3. Create a form.
4. Add text, number, date, and dropdown fields.
5. Mark selected fields as required.
6. Save the form as a draft.
7. Reopen and edit it.
8. Publish the form.

Expected result: the published form becomes available to the Requester.

### 2. Requester flow

1. Sign out and sign in with the Requester account.
2. Open **Requests**.
3. Select the form published by the Administrator.
4. Enter part of the information and save it as a draft.
5. Reopen the draft and confirm that the entered values were retained.
6. Complete all required fields.
7. Submit the request.
8. Note the generated reference number.

Expected result: the status changes to **Submitted** and the request becomes visible to the Reviewer.

### 3. Reviewer approval flow

1. Sign out and sign in with the Reviewer account.
2. Open **Review Queue**.
3. Search for the request by its reference number or form name.
4. Open the request and inspect its answers.
5. Approve it.

Expected result: the status changes to **Approved**, and the approval appears in the activity history.

### 4. Rejection and resubmission flow

1. Sign in as the Requester and submit another request.
2. Sign in as the Reviewer.
3. Reject the request with a meaningful comment.
4. Sign back in as the Requester.
5. Open the rejected request and review the comment.
6. Correct the requested information.
7. Resubmit the request.
8. Sign in as the Reviewer and approve the corrected request.

Expected result: the activity history shows submission, rejection, editing, resubmission, and approval.

### 5. Archive flow

1. Sign in as the Administrator.
2. Open **Form Studio**.
3. Archive the test form.

Expected result: the form is no longer available for new requests. Existing submissions and their recorded form version remain accessible.

## How Docker works in this project

The local environment is defined in compose.yaml and contains two services.

### Database service

The **database** service:

- Runs MySQL 8.4
- Creates the intakeflow database
- Creates the local intakeflow database user
- Exposes MySQL on port 3306
- Stores data in a persistent Docker volume
- Reports its readiness through a MySQL health check

### Application service

The **application** service:

- Builds the root Dockerfile
- Waits until the database is healthy
- Connects to MySQL using Docker's internal network
- Runs Spring Boot on port 8080
- Serves both the Angular interface and REST API
- Enables local sample data

### Docker image build

The Dockerfile uses multiple build stages:

1. A Node.js stage installs frontend dependencies and builds Angular.
2. A Java development stage compiles and packages Spring Boot.
3. The Angular output is copied into Spring Boot's static resources.
4. A smaller Java runtime image runs the completed application.

Only the final runtime image is used after the build. Node.js, Angular CLI, and the Java compiler are not included in the running container.

### Local ports

| Port | Purpose |
| --- | --- |
| 8080 | IntakeFlow web application and API |
| 3306 | Local MySQL database |

### Persistent local data

The MySQL files are stored in the intakeflow_data Docker volume. Stopping the containers does not delete this volume.

To delete all local data and recreate a clean environment:

~~~powershell
docker compose down -v
docker compose up --build
~~~

The -v option permanently deletes only the local Docker database. It does not affect the deployed Aiven database.

## How the database works

MySQL stores the application's users, form definitions, published form versions, fields, dropdown options, submissions, answers, and workflow history.

### Main data model

- **AppUser** stores authentication identity and role.
- **FormDefinition** provides the stable identity of a form.
- **FormVersion** stores a draft or published snapshot.
- **FormField** stores the field type, label, description, order, and required setting.
- **FieldOption** stores ordered dropdown choices.
- **Submission** stores the requester, form version, status, and reference number.
- **SubmissionAnswer** stores an answer for a specific versioned field.
- **WorkflowEvent** stores the audit history for each state change.

### Database migration

Flyway manages the database schema. The migration is located at:

~~~text
backend/src/main/resources/db/migration/V1__initial_schema.sql
~~~

When the application starts:

1. Flyway connects to MySQL.
2. It checks the flyway_schema_history table.
3. It validates the known migrations.
4. It applies any migration that has not already run.
5. Spring Boot continues only after migration succeeds.

No manual SQL setup is required when the application is started with Docker Compose.

Hibernate is configured with ddl-auto=validate. It verifies that the Java entities match the migrated tables, but it does not create or modify the production schema.

### Form versioning

Published forms are immutable. Editing a published form creates a new version instead of changing the existing version.

Each submission points to the exact published version that the requester completed. This ensures that historical submissions remain accurate even after the form is changed later.

### Workflow history

Every important transition creates a WorkflowEvent. This records actions such as:

- Submitted
- Approved
- Rejected
- Resubmitted

The event includes the actor, previous status, new status, time, and review comment when applicable.

## Deployed application

The deployed application is available at:

https://intakeflow.onrender.com

### Production hosting

| Component | Platform | Responsibility |
| --- | --- | --- |
| Source code | GitHub | Stores the reviewed application source |
| Application | Render | Builds and runs the Docker image |
| Database | Aiven MySQL 8.4 | Stores production application data |

### How the deployed version works

1. Render builds the same root Dockerfile used for local packaging.
2. Angular is compiled into static files.
3. Spring Boot and the Angular files are packaged into one Docker image.
4. Render runs the image as one web service.
5. Spring Boot connects to Aiven MySQL through a TLS-encrypted JDBC connection.
6. Flyway validates and applies database migrations during startup.
7. Render checks the readiness endpoint before marking the service available.

The browser receives the Angular application and accesses the REST API through the same Render domain. This avoids separate frontend and backend URLs.

### Production accounts

The deployed database contains separate accounts for the three roles:

| Role | Email |
| --- | --- |
| Administrator | admin@intakeflow.app |
| Requester | requester@intakeflow.app |
| Reviewer | reviewer@intakeflow.app |

Production passwords are not stored in the repository. They are maintained as deployment secrets and should be obtained from the project owner.

### Production differences

- Local demo accounts and sample data are disabled.
- Swagger and OpenAPI documentation are not publicly available.
- Database traffic uses TLS.
- Database passwords, account passwords, and the JWT signing secret are runtime secrets.
- The readiness endpoint is available at https://intakeflow.onrender.com/actuator/health/readiness.

Render and Aiven are currently using free services. They can sleep or power off after inactivity, so the first request may take approximately 50 seconds or longer while the services wake up.

## Architecture

~~~text
Browser
  |
  | HTTPS
  v
Render: Spring Boot container
  |-- Angular static application
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

Angular provides:

- Role-specific navigation and dashboards
- Dynamic form creation and rendering
- Form and request validation feedback
- Loading indicators
- Top-center success and error notifications
- Responsive layouts and accessible controls

### Backend

Spring Boot provides:

- Authentication and JWT creation
- Role and ownership authorization
- Form versioning
- Submission validation
- Workflow state transitions
- Search and pagination
- Audit history
- Health and readiness endpoints

The backend is the security boundary. Frontend route guards improve the user experience, but every protected action is independently checked by the API.

### API groups

| API path | Purpose |
| --- | --- |
| /api/v1/auth | Login and current-user information |
| /api/v1/forms | Form management and published-form discovery |
| /api/v1/submissions | Drafts, submission, decisions, and history |
| /api/v1/dashboard | Role-specific summary information |

The complete domain model, workflow, security boundaries, and reliability decisions are documented in [docs/architecture.md](docs/architecture.md).

## Key design decisions

### Single production container

Angular is built and served by Spring Boot. The interface and API use the same origin, which keeps authentication and routing predictable and prevents frontend and backend deployment versions from drifting.

### Immutable published form versions

Published versions are never edited in place. Existing submissions retain the exact form structure used when they were created.

### Backend-controlled authorization and workflow

The backend enforces roles, ownership, validation, and valid status transitions. Interface visibility is not treated as the security boundary.

### Explicit database migrations

Flyway owns schema evolution. Hibernate validates the result rather than modifying tables automatically.

### Append-only audit trail

Workflow events preserve the sequence of decisions and comments without replacing earlier history.

### Optimistic locking

Submission rows use a version value to prevent simultaneous updates from silently overwriting one another.

### Runtime secrets

Production database credentials, bootstrap account passwords, and the JWT signing secret are injected as environment variables and are not committed to Git.

### Reliability

- Health and readiness probes allow the hosting platform to detect startup failures.
- Graceful shutdown allows active requests to finish.
- Server-side pagination prevents unbounded database reads.
- Published form versioning protects historical data.

## Troubleshooting

### Docker is not running

Open Docker Desktop and wait for it to report that the Docker engine is running. Then repeat:

~~~powershell
docker compose up --build
~~~

### Port 8080 or 3306 is already in use

Stop the existing application using that port or stop old project containers:

~~~powershell
docker compose down
~~~

### MySQL does not become healthy

View the database logs:

~~~powershell
docker compose logs database
~~~

Restart the local environment:

~~~powershell
docker compose down
docker compose up --build
~~~

### Application container does not start

View the application logs:

~~~powershell
docker compose logs application
~~~

Look for a database connection error or migration failure.

### Local login fails

Confirm that the email ends in @intakeflow.demo and use the local password IntakeFlow@2026.

### A clean local database is required

~~~powershell
docker compose down -v
docker compose up --build
~~~

This deletes all local records and reloads the sample data.

### Deployed application is initially slow

Wait for the Render and Aiven free services to wake up, then refresh the page.
