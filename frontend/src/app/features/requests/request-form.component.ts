import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/feedback.service';
import { FieldDefinition, FormDefinition } from '../../core/models';
@Component({
  selector: 'app-request-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page page--narrow">
    <a class="back-link" routerLink="/requests">← Back to requests</a>
    @if (loading()) {
      <section class="panel page-state" aria-live="polite">
        <h2>Loading request form…</h2>
        <p>Preparing the latest published version.</p>
      </section>
    } @else if (pageError()) {
      <section class="panel page-state" role="alert">
        <h2>Form unavailable</h2>
        <p>{{ pageError() }}</p>
        <a class="button button--secondary" routerLink="/requests">Choose another form</a>
      </section>
    } @else if (formDef(); as definition) {
      <header class="request-form-header">
        <span class="eyebrow">New request · Version {{ definition.version }}</span>
        <h1>{{ definition.title }}</h1>
        <p>{{ definition.description }}</p>
        <div class="form-progress">
          <span class="active"></span><span [class.active]="reviewing()"></span
          ><small>Request details</small><small>Review & submit</small>
        </div>
      </header>
      @if (error()) {
        <div class="alert alert--error">{{ error() }}</div>
      }
      @if (!reviewing()) {
        <form class="panel request-form" [formGroup]="form" (ngSubmit)="review()" novalidate>
          <div class="form-section-heading">
            <span>01</span>
            <div>
              <h2>Request information</h2>
              <p>Complete the information below. You can save a draft at any time.</p>
            </div>
          </div>
          @for (field of definition.fields; track field.key) {
            <label class="dynamic-field"
              ><span
                >{{ field.label }}
                @if (field.required) {
                  <em>*</em>
                }
              </span>
              @if (field.description) {
                <small>{{ field.description }}</small>
              }
              @switch (field.type) {
                @case ('DROPDOWN') {
                  <select [formControlName]="field.key">
                    <option value="">Select an option</option>
                    @for (option of field.options; track option) {
                      <option [value]="option">{{ option }}</option>
                    }
                  </select>
                }
                @case ('DATE') {
                  <input type="date" [formControlName]="field.key" />
                }
                @case ('NUMBER') {
                  <input type="number" [formControlName]="field.key" placeholder="Enter a number" />
                }
                @default {
                  <input
                    type="text"
                    [formControlName]="field.key"
                    placeholder="Enter your response"
                  />
                }
              }
              @if (control(field).touched && control(field).invalid) {
                <span class="field-error visible">{{ field.label }} is required</span>
              }
            </label>
          }
          <footer class="form-actions">
            <span
              ><strong>Your progress is protected</strong
              ><small>Save a draft and return whenever you need.</small></span
            ><button
              type="button"
              class="button button--secondary"
              (click)="submit(false)"
              [disabled]="saving()"
            >
              {{ saving() ? 'Saving…' : 'Save draft' }}</button
            ><button type="submit" class="button button--primary" [disabled]="saving()">
              Review request
            </button>
          </footer>
        </form>
      } @else {
        <section class="panel request-review">
          <div class="form-section-heading">
            <span>02</span>
            <div>
              <h2>Review your request</h2>
              <p>Confirm these details before sending the request for review.</p>
            </div>
          </div>
          <dl class="answer-grid">
            @for (field of definition.fields; track field.key) {
              <div>
                <dt>{{ field.label }}</dt>
                <dd>{{ displayValue(field) }}</dd>
                <small>{{ field.type.toLowerCase() }} field</small>
              </div>
            }
          </dl>
          <footer class="form-actions">
            <span
              ><strong>Ready to submit?</strong
              ><small>You can return to editing before sending.</small></span
            ><button
              type="button"
              class="button button--secondary"
              (click)="reviewing.set(false)"
              [disabled]="saving()"
            >
              Back to edit</button
            ><button
              type="button"
              class="button button--primary"
              (click)="submit(true)"
              [disabled]="saving()"
            >
              {{ saving() ? 'Submitting…' : 'Submit request' }}
            </button>
          </footer>
        </section>
      }
    }
  </main>`,
})
export class RequestFormComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toasts = inject(ToastService);
  form = this.fb.group({});
  formDef = signal<FormDefinition | null>(null);
  loading = signal(true);
  pageError = signal('');
  reviewing = signal(false);
  saving = signal(false);
  error = signal('');
  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('formId'));
    this.api.publishedForms().subscribe({
      next: (forms) => {
        const def = forms.find((f) => f.id === id);
        this.loading.set(false);
        if (!def) {
          this.pageError.set('This form is no longer available.');
          return;
        }
        this.formDef.set(def);
        for (const field of def.fields)
          this.form.addControl(
            field.key,
            new FormControl('', field.required ? Validators.required : []),
          );
      },
      error: () => {
        this.loading.set(false);
        this.pageError.set('We could not load this form. Try again from the requests page.');
      },
    });
  }
  control(field: FieldDefinition) {
    return this.form.get(field.key)!;
  }
  review() {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Complete the required fields before continuing.');
      this.toasts.error('Required information missing', 'Complete the highlighted fields.');
      return;
    }
    this.reviewing.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  displayValue(field: FieldDefinition) {
    return String(this.form.get(field.key)?.value ?? '').trim() || 'Not provided';
  }
  submit(final: boolean) {
    if (final && this.form.invalid) return this.review();
    this.saving.set(true);
    this.error.set('');
    const def = this.formDef()!;
    const answers = this.form.getRawValue() as Record<string, string>;
    this.api.createSubmission(def.id, answers).subscribe({
      next: (draft) => {
        if (!final) {
          this.toasts.success('Draft saved', `${draft.referenceCode} is safely stored.`);
          void this.router.navigate(['/requests', draft.id]);
          return;
        }
        this.api.submit(draft.id).subscribe({
          next: () => {
            this.toasts.success('Request submitted', `${draft.referenceCode} was sent for review.`);
            void this.router.navigate(['/requests', draft.id]);
          },
          error: (e) => {
            this.saving.set(false);
            this.error.set(e.error?.detail ?? 'Could not submit this request.');
          },
        });
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e.error?.detail ?? 'Could not save this request.');
      },
    });
  }
}
