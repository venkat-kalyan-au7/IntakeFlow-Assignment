# Architecture

## System shape

IntakeFlow ships as one container in production. Angular is compiled into static assets and served by Spring Boot, while REST endpoints remain under `/api/v1`. MySQL stores form definitions, immutable published versions, submissions, answers, and workflow history.

```text
Browser
  |
  | HTTPS
  v
Spring Boot container
  |-- Angular static application
  |-- REST API and JWT authorization
  |-- validation and workflow services
  |-- Flyway migrations
  |
  | TLS JDBC
  v
MySQL 8.4
```

The single-origin deployment keeps authentication and routing predictable and allows the same image to run locally, in CI, and on Render.

## Domain model

- `FormDefinition` is the stable identity of a business form.
- `FormVersion` contains a draft or published snapshot of that form.
- `FormField` defines type, label, help text, order, and requirement rules.
- `FieldOption` stores ordered choices for dropdown fields.
- `Submission` references the exact published form version used by the requester.
- `SubmissionAnswer` stores one answer for one versioned field.
- `WorkflowEvent` is the append-only audit trail for every meaningful state change.

Published form versions are never edited in place. A new draft is created for subsequent changes, which preserves the meaning and rendering of historical submissions.

## Workflow

```text
                save
              +------+
              |      v
           [DRAFT] ------ submit ------> [SUBMITTED]
                                          |       |
                                     approve     reject + comment
                                          |       |
                                          v       v
                                     [APPROVED] [REJECTED]
                                                    |
                                               edit + resubmit
                                                    |
                                                    +----> [SUBMITTED]
```

The backend owns all transition rules. The frontend hides unavailable actions for clarity, but API authorization and validation are the security boundary.

## Security

- Passwords are stored with BCrypt strength 12.
- Login produces a short-lived HMAC-signed JWT containing the user identifier and role.
- API routes require authentication; service methods enforce ownership and role rules.
- Requesters can access only their own submissions.
- Reviewers can act only on submitted requests.
- Rejections require a meaningful comment.
- Database credentials and signing secrets are runtime environment variables.

The demo seed is controlled by `APP_DEMO_MODE` and should be disabled for a real tenant.

## Reliability decisions

- Flyway owns schema evolution; Hibernate validates rather than modifying production tables.
- Submission rows use optimistic locking to prevent silent concurrent updates.
- Published form versions protect historical data from later form changes.
- Health and readiness probes support managed hosting restarts.
- Graceful shutdown allows in-flight requests to finish.
- Page size is bounded server-side to avoid unbounded reads.

## API surface

The API is grouped by capability:

- `/api/v1/auth` — authentication and current-user context
- `/api/v1/forms` — form lifecycle and published form discovery
- `/api/v1/submissions` — drafts, submission, decisions, and history
- `/api/v1/dashboard` — role-specific summary data

OpenAPI documentation is generated from the running application at `/api-docs`.
