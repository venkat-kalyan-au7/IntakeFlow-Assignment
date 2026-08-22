export type Role = 'ADMIN' | 'REQUESTER' | 'REVIEWER';
export type FieldType = 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'DATE';
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export interface User {
  id: number;
  email: string;
  displayName: string;
  role: Role;
}
export interface AuthResponse {
  token: string;
  user: User;
}
export interface FieldDefinition {
  id?: number;
  key: string;
  label: string;
  description?: string;
  type: FieldType;
  required: boolean;
  position?: number;
  options: string[];
}
export interface FormDefinition {
  id: number;
  versionId: number;
  version: number;
  slug: string;
  title: string;
  description?: string;
  status: FormStatus;
  publishedAt?: string;
  fields: FieldDefinition[];
}
export interface WorkflowEvent {
  id: number;
  action: string;
  fromStatus?: SubmissionStatus;
  toStatus: SubmissionStatus;
  comment?: string;
  actor: string;
  createdAt: string;
}
export interface Answer {
  key: string;
  label: string;
  type: FieldType;
  value: string;
}
export interface Submission {
  id: number;
  referenceCode: string;
  formId: number;
  formVersionId: number;
  formTitle: string;
  formVersion: number;
  requesterName: string;
  requesterEmail: string;
  status: SubmissionStatus;
  rejectionComment?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  answers: Answer[];
  activity: WorkflowEvent[];
}
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface Dashboard {
  drafts: number;
  submitted: number;
  approved: number;
  rejected: number;
  publishedForms: number;
  recent: Submission[];
}
export interface Problem {
  title?: string;
  detail?: string;
  errors?: Record<string, string>;
}
