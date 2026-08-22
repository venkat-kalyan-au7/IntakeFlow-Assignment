import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/feedback.service';
import { AuthService } from '../../core/auth.service';
import { FormDefinition, Submission } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';
@Component({
  selector: 'app-request-detail',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page page--detail">
    @if (item(); as request) {
      <div class="detail-breadcrumb">
        <a [routerLink]="backLink()">{{
          auth.user()?.role === 'REVIEWER' ? 'Review Queue' : 'Requests'
        }}</a
        ><span>›</span><span>{{ request.referenceCode }}</span>
      </div>
      <header class="detail-header">
        <div>
          <div class="detail-title-row">
            <h1>{{ request.formTitle }}</h1>
            <app-status-badge [status]="request.status" />
          </div>
          <p>
            {{ request.referenceCode }} · Submitted by {{ request.requesterName }} · Form version
            {{ request.formVersion }}
          </p>
        </div>
        @if (auth.user()?.role === 'REVIEWER' && request.status === 'SUBMITTED') {
          <div class="detail-actions">
            <button class="button button--secondary button--danger" (click)="rejectOpen.set(true)">
              Request changes</button
            ><button class="button button--primary" (click)="approve()">Approve request</button>
          </div>
        }
        @if (auth.user()?.role === 'REQUESTER' && request.status === 'REJECTED') {
          <button class="button button--primary" (click)="editing.set(!editing())">
            {{ editing() ? 'Cancel editing' : 'Update request' }}
          </button>
        }
      </header>
      @if (request.rejectionComment) {
        <div class="alert alert--attention">
          <strong>Changes requested</strong><span>{{ request.rejectionComment }}</span>
        </div>
      }
      @if (message()) {
        <div class="alert alert--success">{{ message() }}</div>
      }
      @if (error() && !rejectOpen()) {
        <div class="alert alert--error">{{ error() }}</div>
      }
      <section class="detail-grid">
        <article class="panel detail-content">
          <div class="detail-section-heading">
            <span>Request information</span
            ><small>Last updated {{ request.updatedAt | date: 'MMM d, y, h:mm a' }}</small>
          </div>
          @if (editing() && definition(); as def) {
            <form [formGroup]="editForm" class="edit-grid">
              @for (field of def.fields; track field.key) {
                <label
                  ><span
                    >{{ field.label }}
                    @if (field.required) {
                      <em>*</em>
                    }
                  </span>
                  @switch (field.type) {
                    @case ('DROPDOWN') {
                      <select [formControlName]="field.key">
                        @for (option of field.options; track option) {
                          <option [value]="option">{{ option }}</option>
                        }
                      </select>
                    }
                    @case ('DATE') {
                      <input type="date" [formControlName]="field.key" />
                    }
                    @case ('NUMBER') {
                      <input type="number" [formControlName]="field.key" />
                    }
                    @default {
                      <input [formControlName]="field.key" />
                    }
                  }
                  @if (
                    editForm.controls[field.key].touched && editForm.controls[field.key].invalid
                  ) {
                    <span class="field-error visible">{{ field.label }} is required</span>
                  }
                </label>
              }
              <div class="edit-actions">
                <button
                  type="button"
                  class="button button--secondary"
                  (click)="save(false)"
                  [disabled]="saving()"
                >
                  Save changes</button
                ><button
                  type="button"
                  class="button button--primary"
                  (click)="save(true)"
                  [disabled]="saving()"
                >
                  Resubmit
                </button>
              </div>
            </form>
          } @else {
            <dl class="answer-grid">
              @for (answer of request.answers; track answer.key) {
                <div>
                  <dt>{{ answer.label }}</dt>
                  <dd>{{ answer.value || '—' }}</dd>
                  <small>{{ answer.type.toLowerCase() }} field</small>
                </div>
              }
            </dl>
          }
        </article>
        <aside class="panel activity-panel">
          <header>
            <h2>Activity</h2>
            <p>A complete record of this request.</p>
          </header>
          <ol class="timeline">
            @for (event of request.activity; track event.id; let last = $last) {
              <li [class.complete]="last">
                <span class="timeline__node"></span>
                <div>
                  <strong>{{ eventLabel(event.action) }}</strong>
                  <p>{{ event.actor }}</p>
                  @if (event.comment) {
                    <blockquote>{{ event.comment }}</blockquote>
                  }
                  <time>{{ event.createdAt | date: 'MMM d, y · h:mm a' }}</time>
                </div>
              </li>
            }
          </ol>
        </aside>
      </section>
      @if (rejectOpen()) {
        <div class="modal-backdrop" (click)="rejectOpen.set(false)">
          <section
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            (click)="$event.stopPropagation()"
          >
            <span class="modal__mark">!</span>
            <h2 id="reject-title">Request changes</h2>
            <p>Explain clearly what needs to be updated. The requester will see this comment.</p>
            <label
              >Comment<textarea
                #comment
                rows="5"
                placeholder="Describe the required changes"
              ></textarea>
            </label>
            @if (error()) {
              <span class="field-error visible">{{ error() }}</span>
            }
            <footer>
              <button class="button button--secondary" (click)="rejectOpen.set(false)">
                Cancel</button
              ><button class="button button--danger-solid" (click)="reject(comment.value)">
                Send back to requester
              </button>
            </footer>
          </section>
        </div>
      }
    }
  </main>`,
})
export class RequestDetailComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  private toasts = inject(ToastService);
  item = signal<Submission | null>(null);
  definition = signal<FormDefinition | null>(null);
  editing = signal(false);
  rejectOpen = signal(false);
  message = signal('');
  error = signal('');
  saving = signal(false);
  editForm = new FormGroup<Record<string, FormControl<string>>>({});
  private id = Number(this.route.snapshot.paramMap.get('id'));
  constructor() {
    this.load();
  }
  load() {
    this.api.submission(this.id).subscribe((item) => {
      this.item.set(item);
      if (item.status === 'REJECTED') {
        this.api.formVersion(item.formVersionId).subscribe((definition) => {
          this.definition.set(definition);
          const answers = new Map(item.answers.map((answer) => [answer.key, answer.value]));
          this.editForm = new FormGroup({});
          for (const field of definition.fields) {
            this.editForm.addControl(
              field.key,
              new FormControl(answers.get(field.key) ?? '', {
                nonNullable: true,
                validators: field.required ? [Validators.required] : [],
              }),
            );
          }
        });
      }
    });
  }
  backLink() {
    return this.auth.user()?.role === 'REVIEWER' ? '/review' : '/requests';
  }
  approve() {
    this.api.approve(this.id).subscribe((x) => {
      this.item.set(x);
      this.message.set('Request approved successfully.');
      this.toasts.success('Request approved', `${x.referenceCode} is complete.`);
    });
  }
  reject(comment: string) {
    if (comment.trim().length < 3) {
      this.error.set('Enter a meaningful comment before continuing.');
      return;
    }
    this.api.reject(this.id, comment.trim()).subscribe({
      next: (x) => {
        this.item.set(x);
        this.rejectOpen.set(false);
        this.message.set('The request was returned with clear next steps.');
        this.toasts.success(
          'Changes requested',
          `${x.referenceCode} was returned to the requester.`,
        );
      },
      error: (e) => this.error.set(e.error?.detail ?? 'Could not update the request.'),
    });
  }
  save(resubmit: boolean) {
    this.error.set('');
    if (resubmit && this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.error.set('Complete the required fields before resubmitting.');
      return;
    }
    this.saving.set(true);
    const values = this.editForm.getRawValue();
    this.api.updateSubmission(this.id, values).subscribe({
      next: (x) => {
        if (!resubmit) {
          this.item.set(x);
          this.editing.set(false);
          this.saving.set(false);
          this.message.set('Changes saved.');
          this.toasts.success('Changes saved', `${x.referenceCode} remains ready for editing.`);
          return;
        }
        this.api.submit(this.id).subscribe({
          next: (y) => {
            this.item.set(y);
            this.editing.set(false);
            this.saving.set(false);
            this.message.set('Request resubmitted for review.');
            this.toasts.success(
              'Request resubmitted',
              `${y.referenceCode} is back in the review queue.`,
            );
          },
          error: (e) => {
            this.saving.set(false);
            this.error.set(e.error?.detail ?? 'Could not resubmit this request.');
          },
        });
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e.error?.detail ?? 'Could not save changes.');
      },
    });
  }
  eventLabel(action: string) {
    return (
      (
        {
          DRAFT_SAVED: 'Draft created',
          CHANGES_SAVED: 'Changes saved',
          SUBMITTED: 'Submitted for review',
          RESUBMITTED: 'Resubmitted for review',
          APPROVED: 'Request approved',
          REJECTED: 'Changes requested',
        } as Record<string, string>
      )[action] ?? action
    );
  }
}
