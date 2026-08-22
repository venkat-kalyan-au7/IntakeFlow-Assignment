# IntakeFlow

IntakeFlow is a configurable request intake and approval platform. Teams can publish reusable forms, collect structured requests, review submissions, and retain a complete decision history without changing application code for every process.

The interface is deliberately lightweight: requesters see only the information and actions relevant to them, while reviewers and administrators get focused workspaces for decisions and form management.

## Product capabilities

- Drag-and-drop form builder with text, number, date, and dropdown fields
- Required and optional field rules with instant form preview
- Draft saving, submission, rejection editing, and resubmission
- Approval and rejection workflow with mandatory reviewer feedback
- Role-based dashboards for administrators, requesters, and reviewers
- Search, status filters, responsive tables, clear empty states, and activity history
- JWT authentication, database migrations, optimistic locking, health probes, and OpenAPI documentation

## Technology

| Layer       | Version   |
| ----------- | --------- |
| Angular     | 22.1      |
| Node.js     | 24.19 LTS |
| Spring Boot | 4.1.1     |
| Java        | 25 LTS    |
| MySQL       | 8.4 LTS   |

## Run locally with Docker

Docker is the only prerequisite.

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The database is created automatically and Flyway applies the schema on startup.

Demo accounts use the password `IntakeFlow@2026`:

| Role          | Email                       |
| ------------- | --------------------------- |
| Administrator | `admin@intakeflow.demo`     |
| Requester     | `requester@intakeflow.demo` |
| Reviewer      | `reviewer@intakeflow.demo`  |

The demo seed also includes a published vendor onboarding form and requests in submitted, approved, and rejected states.

## Developer setup

### Backend

Start MySQL 8.4, copy `.env.example` values into your environment, and run:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows use `mvnw.cmd`. The API runs on port `8080`; interactive API documentation is available at `/api-docs`.

### Frontend

```bash
cd frontend
npm ci
npm start
```

The Angular development server runs on port `4200` and calls the API at `http://localhost:8080/api/v1`.

## Verification

```bash
cd backend && ./mvnw test
cd frontend && npm run build
docker build -t intakeflow .
node scripts/test-role-workflows.mjs
```

The GitHub Actions workflow runs the same frontend, backend, and container checks for every pull request and push to `main`.

## Deployment

The repository includes a Render Blueprint and a single production Docker image that serves both the Angular application and Spring Boot API. This avoids cross-origin and version-drift issues between separate frontend and backend deployments.

1. Create a MySQL 8.4 service on Aiven.
2. Create a Render Blueprint from this repository.
3. Set the three database variables from the Aiven service page. Use a JDBC URL in this form:

   `jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED&serverTimezone=UTC`

4. Set strong, unique passwords for `APP_BOOTSTRAP_ADMIN_PASSWORD`,
   `APP_BOOTSTRAP_REQUESTER_PASSWORD`, and `APP_BOOTSTRAP_REVIEWER_PASSWORD`.
5. Deploy. Render supplies the application port and generates the JWT secret.

The production Blueprint disables demo data and public OpenAPI/Swagger endpoints. On the first
startup, the three bootstrap accounts are created only when they do not already exist. Passwords
are BCrypt-hashed before persistence and remain secret Render environment variables.

Free-tier availability can vary by provider and region. Never commit production credentials; all sensitive settings are injected at runtime.

## Design and architecture

See [Architecture](docs/architecture.md) for the domain model, workflow rules, security boundaries, and deployment shape.
