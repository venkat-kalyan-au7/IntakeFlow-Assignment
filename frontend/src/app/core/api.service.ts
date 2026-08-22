import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Dashboard, FormDefinition, PageResponse, Submission, SubmissionStatus } from './models';
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api/v1';
  dashboard() {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }
  forms() {
    return this.http.get<FormDefinition[]>(`${this.base}/forms`);
  }
  publishedForms() {
    return this.http.get<FormDefinition[]>(`${this.base}/forms/published`);
  }
  formVersion(id: number) {
    return this.http.get<FormDefinition>(`${this.base}/forms/versions/${id}`);
  }
  createForm(body: object) {
    return this.http.post<FormDefinition>(`${this.base}/forms`, body);
  }
  updateForm(id: number, body: object) {
    return this.http.put<FormDefinition>(`${this.base}/forms/${id}`, body);
  }
  publishForm(id: number) {
    return this.http.post<FormDefinition>(`${this.base}/forms/${id}/publish`, {});
  }
  archiveForm(id: number) {
    return this.http.delete<void>(`${this.base}/forms/${id}`);
  }
  submissions(status?: SubmissionStatus, page = 0, size = 10) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<Submission>>(`${this.base}/submissions`, { params });
  }
  submission(id: number) {
    return this.http.get<Submission>(`${this.base}/submissions/${id}`);
  }
  createSubmission(formId: number, answers: Record<string, string>) {
    return this.http.post<Submission>(`${this.base}/forms/${formId}/submissions`, { answers });
  }
  updateSubmission(id: number, answers: Record<string, string>) {
    return this.http.put<Submission>(`${this.base}/submissions/${id}`, { answers });
  }
  submit(id: number) {
    return this.http.post<Submission>(`${this.base}/submissions/${id}/submit`, {});
  }
  approve(id: number) {
    return this.http.post<Submission>(`${this.base}/submissions/${id}/approve`, {});
  }
  reject(id: number, comment: string) {
    return this.http.post<Submission>(`${this.base}/submissions/${id}/reject`, { comment });
  }
}
