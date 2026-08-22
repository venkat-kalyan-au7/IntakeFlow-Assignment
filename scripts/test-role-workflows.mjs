const baseUrl = process.env.BASE_URL ?? "http://localhost:8080";
let passed = 0;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function expectStatus(name, expected, action) {
  const result = await action();
  check(
    result.status === expected,
    `${name}: expected ${expected}, received ${result.status}: ${JSON.stringify(result.data)}`,
  );
  passed++;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
  return result.data;
}

async function login(email, password = "IntakeFlow@2026") {
  return expectStatus(`login ${email}`, 200, () =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  );
}

const suffix = Date.now().toString(36);
await expectStatus("anonymous API access is rejected", 401, () =>
  request("/api/v1/dashboard"),
);
await expectStatus("invalid credentials are rejected", 401, () =>
  request("/api/v1/auth/login", {
    method: "POST",
    body: { email: "requester@intakeflow.demo", password: "wrong-password" },
  }),
);

const admin = await login("admin@intakeflow.demo");
const requester = await login("requester@intakeflow.demo");
const reviewer = await login("reviewer@intakeflow.demo");

for (const account of [admin, requester, reviewer]) {
  const me = await expectStatus(
    `read ${account.user.role.toLowerCase()} profile`,
    200,
    () => request("/api/v1/auth/me", { token: account.token }),
  );
  check(
    me.role === account.user.role,
    "Profile role does not match login response",
  );
}

await expectStatus("requester cannot list admin forms", 403, () =>
  request("/api/v1/forms", { token: requester.token }),
);
await expectStatus("reviewer cannot create forms", 403, () =>
  request("/api/v1/forms", {
    token: reviewer.token,
    method: "POST",
    body: {
      title: "Forbidden",
      fields: [
        {
          key: "name",
          label: "Name",
          type: "TEXT",
          required: true,
          options: [],
        },
      ],
    },
  }),
);

const formInput = {
  title: `Regression Intake ${suffix}`,
  description: "Automated full-role workflow coverage",
  fields: [
    {
      key: "company",
      label: "Company",
      type: "TEXT",
      required: true,
      options: [],
    },
    {
      key: "headcount",
      label: "Headcount",
      type: "NUMBER",
      required: true,
      options: [],
    },
    {
      key: "category",
      label: "Category",
      type: "DROPDOWN",
      required: true,
      options: ["Technology", "Facilities"],
    },
    {
      key: "start_date",
      label: "Start date",
      type: "DATE",
      required: true,
      options: [],
    },
    {
      key: "notes",
      label: "Notes",
      type: "TEXT",
      required: false,
      options: [],
    },
  ],
};

const createdForm = await expectStatus("admin creates dynamic form", 200, () =>
  request("/api/v1/forms", {
    token: admin.token,
    method: "POST",
    body: formInput,
  }),
);
check(createdForm.status === "DRAFT", "New form must be a draft");
const updatedForm = await expectStatus("admin updates draft form", 200, () =>
  request(`/api/v1/forms/${createdForm.id}`, {
    token: admin.token,
    method: "PUT",
    body: { ...formInput, description: "Updated automated workflow coverage" },
  }),
);
check(
  updatedForm.description.startsWith("Updated"),
  "Form update was not persisted",
);
await expectStatus("duplicate field keys are rejected", 400, () =>
  request(`/api/v1/forms/${createdForm.id}`, {
    token: admin.token,
    method: "PUT",
    body: { ...formInput, fields: [formInput.fields[0], formInput.fields[0]] },
  }),
);
const publishedForm = await expectStatus("admin publishes form", 200, () =>
  request(`/api/v1/forms/${createdForm.id}/publish`, {
    token: admin.token,
    method: "POST",
  }),
);
const publishedList = await expectStatus(
  "requester reads published forms",
  200,
  () => request("/api/v1/forms/published", { token: requester.token }),
);
check(
  publishedList.some((form) => form.id === createdForm.id),
  "Published form is missing",
);

await expectStatus("unknown answer field is rejected", 400, () =>
  request(`/api/v1/forms/${createdForm.id}/submissions`, {
    token: requester.token,
    method: "POST",
    body: { answers: { unknown: "value" } },
  }),
);
const draft = await expectStatus("requester saves incomplete draft", 200, () =>
  request(`/api/v1/forms/${createdForm.id}/submissions`, {
    token: requester.token,
    method: "POST",
    body: { answers: { company: "Incomplete Co" } },
  }),
);
await expectStatus("reviewer cannot open an unsubmitted draft", 403, () =>
  request(`/api/v1/submissions/${draft.id}`, { token: reviewer.token }),
);
const reviewerAllBeforeSubmit = await expectStatus(
  "reviewer all queue excludes unsubmitted drafts",
  200,
  () => request("/api/v1/submissions?page=0&size=50", { token: reviewer.token }),
);
check(
  !reviewerAllBeforeSubmit.content.some((item) => item.id === draft.id),
  "Reviewer queue exposed an unsubmitted draft",
);
await expectStatus("incomplete draft cannot be submitted", 400, () =>
  request(`/api/v1/submissions/${draft.id}/submit`, {
    token: requester.token,
    method: "POST",
  }),
);

const validAnswers = {
  company: "Northwind Test Labs",
  headcount: "48",
  category: "Technology",
  start_date: "2026-09-30",
};
await expectStatus("requester stores invalid dropdown in draft", 200, () =>
  request(`/api/v1/submissions/${draft.id}`, {
    token: requester.token,
    method: "PUT",
    body: { answers: { ...validAnswers, category: "Unknown" } },
  }),
);
await expectStatus("invalid dropdown blocks submission", 400, () =>
  request(`/api/v1/submissions/${draft.id}/submit`, {
    token: requester.token,
    method: "POST",
  }),
);
await expectStatus(
  "requester updates draft with valid typed answers",
  200,
  () =>
    request(`/api/v1/submissions/${draft.id}`, {
      token: requester.token,
      method: "PUT",
      body: { answers: validAnswers },
    }),
);
const submitted = await expectStatus(
  "requester submits complete draft",
  200,
  () =>
    request(`/api/v1/submissions/${draft.id}/submit`, {
      token: requester.token,
      method: "POST",
    }),
);
const searchedReviewPage = await expectStatus(
  "reviewer searches the full queue on the server",
  200,
  () =>
    request(`/api/v1/submissions?status=SUBMITTED&query=${suffix}&page=0&size=10`, {
      token: reviewer.token,
    }),
);
check(
  searchedReviewPage.content.some((item) => item.id === submitted.id),
  "Server-side review search did not return the submitted request",
);
await expectStatus("submitted request cannot be edited", 409, () =>
  request(`/api/v1/submissions/${submitted.id}`, {
    token: requester.token,
    method: "PUT",
    body: { answers: validAnswers },
  }),
);
await expectStatus("requester cannot approve", 403, () =>
  request(`/api/v1/submissions/${submitted.id}/approve`, {
    token: requester.token,
    method: "POST",
  }),
);
await expectStatus("reviewer cannot edit requester data", 403, () =>
  request(`/api/v1/submissions/${submitted.id}`, {
    token: reviewer.token,
    method: "PUT",
    body: { answers: validAnswers },
  }),
);
const reviewPage = await expectStatus(
  "reviewer filters and paginates submitted queue",
  200,
  () =>
    request("/api/v1/submissions?status=SUBMITTED&page=0&size=1", {
      token: reviewer.token,
    }),
);
check(
  reviewPage.size === 1 && reviewPage.totalElements >= 1,
  "Pagination response is incorrect",
);
await expectStatus("reviewer approves submitted request", 200, () =>
  request(`/api/v1/submissions/${submitted.id}/approve`, {
    token: reviewer.token,
    method: "POST",
  }),
);
await expectStatus("approved request cannot be approved twice", 409, () =>
  request(`/api/v1/submissions/${submitted.id}/approve`, {
    token: reviewer.token,
    method: "POST",
  }),
);

const secondDraft = await expectStatus(
  "requester creates second draft",
  200,
  () =>
    request(`/api/v1/forms/${createdForm.id}/submissions`, {
      token: requester.token,
      method: "POST",
      body: { answers: validAnswers },
    }),
);
await expectStatus("requester submits second request", 200, () =>
  request(`/api/v1/submissions/${secondDraft.id}/submit`, {
    token: requester.token,
    method: "POST",
  }),
);
await expectStatus("blank rejection comment is rejected", 400, () =>
  request(`/api/v1/submissions/${secondDraft.id}/reject`, {
    token: reviewer.token,
    method: "POST",
    body: { comment: " " },
  }),
);
const rejected = await expectStatus(
  "reviewer rejects with actionable comment",
  200,
  () =>
    request(`/api/v1/submissions/${secondDraft.id}/reject`, {
      token: reviewer.token,
      method: "POST",
      body: { comment: "Please confirm the final start date." },
    }),
);
check(
  rejected.activity.some((event) => event.action === "REJECTED"),
  "Rejection history is missing",
);
await expectStatus("rejected request cannot be rejected twice", 409, () =>
  request(`/api/v1/submissions/${secondDraft.id}/reject`, {
    token: reviewer.token,
    method: "POST",
    body: { comment: "Again" },
  }),
);
await expectStatus(
  "requester edits rejected request without optional field",
  200,
  () =>
    request(`/api/v1/submissions/${secondDraft.id}`, {
      token: requester.token,
      method: "PUT",
      body: { answers: { ...validAnswers, start_date: "2026-10-05" } },
    }),
);
const resubmitted = await expectStatus(
  "requester resubmits rejected request",
  200,
  () =>
    request(`/api/v1/submissions/${secondDraft.id}/submit`, {
      token: requester.token,
      method: "POST",
    }),
);
check(
  resubmitted.activity.some((event) => event.action === "RESUBMITTED"),
  "Resubmission history is missing",
);
await expectStatus("reviewer approves resubmitted request", 200, () =>
  request(`/api/v1/submissions/${secondDraft.id}/approve`, {
    token: reviewer.token,
    method: "POST",
  }),
);

const privateDraft = await expectStatus(
  "admin creates unpublished fixture",
  200,
  () =>
    request("/api/v1/forms", {
      token: admin.token,
      method: "POST",
      body: { ...formInput, title: `Private Draft ${suffix}` },
    }),
);
await expectStatus("reviewer cannot read unpublished version", 403, () =>
  request(`/api/v1/forms/versions/${privateDraft.versionId}`, {
    token: reviewer.token,
  }),
);
await expectStatus("admin archives form", 204, () =>
  request(`/api/v1/forms/${createdForm.id}`, {
    token: admin.token,
    method: "DELETE",
  }),
);
const afterArchive = await expectStatus(
  "archived form leaves requester catalogue",
  200,
  () => request("/api/v1/forms/published", { token: requester.token }),
);
check(
  !afterArchive.some((form) => form.id === createdForm.id),
  "Archived form is still published",
);
await expectStatus("owner reads archived submitted form version", 200, () =>
  request(`/api/v1/forms/versions/${publishedForm.versionId}`, {
    token: requester.token,
  }),
);
await expectStatus("archiving missing form returns not found", 404, () =>
  request("/api/v1/forms/999999999", { token: admin.token, method: "DELETE" }),
);
await expectStatus("admin archives unpublished fixture", 204, () =>
  request(`/api/v1/forms/${privateDraft.id}`, {
    token: admin.token,
    method: "DELETE",
  }),
);

for (const account of [admin, requester, reviewer]) {
  await expectStatus(
    `${account.user.role.toLowerCase()} dashboard loads`,
    200,
    () => request("/api/v1/dashboard", { token: account.token }),
  );
}

console.log(
  `\nAll ${passed} API role/workflow scenarios passed against ${baseUrl}.`,
);
