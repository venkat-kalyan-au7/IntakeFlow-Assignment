import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { FieldDefinition, FormDefinition } from '../../core/models';
@Component({
  selector: 'app-request-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page page--narrow">
    <a class="back-link" routerLink="/requests">← Back to requests</a>
    @if (formDef(); as definition) {
      <header class="request-form-header">
        <span class="eyebrow">New request · Version {{ definition.version }}</span>
        <h1>{{ definition.title }}</h1>
        <p>{{ definition.description }}</p>
        <div class="form-progress">
          <span class="active"></span><span></span><small>Request details</small
          ><small>Review & submit</small>
        </div>
      </header>
      @if (error()) {
        <div class="alert alert--error">{{ error() }}</div>
      }
      <form class="panel request-form" [formGroup]="form" (ngSubmit)="submit(false)" novalidate>
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
            Save draft</button
          ><button
            type="button"
            class="button button--primary"
            (click)="submit(true)"
            [disabled]="saving()"
          >
            Review & submit
          </button>
        </footer>
      </form>
    }
  </main>`,
})
export class RequestFormComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  form = this.fb.group({});
  formDef = signal<FormDefinition | null>(null);
  saving = signal(false);
  error = signal('');
  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('formId'));
    this.api.publishedForms().subscribe((forms) => {
      const def = forms.find((f) => f.id === id);
      if (!def) {
        this.error.set('This form is no longer available.');
        return;
      }
      this.formDef.set(def);
      for (const field of def.fields)
        this.form.addControl(
          field.key,
          new FormControl('', field.required ? Validators.required : []),
        );
    });
  }
  control(field: FieldDefinition) {
    return this.form.get(field.key)!;
  }
  submit(final: boolean) {
    if (final && this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Complete the required fields before submitting.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const def = this.formDef()!;
    const answers = this.form.getRawValue() as Record<string, string>;
    this.api.createSubmission(def.id, answers).subscribe({
      next: (draft) => {
        if (!final) {
          void this.router.navigate(['/requests', draft.id]);
          return;
        }
        this.api.submit(draft.id).subscribe({
          next: () => void this.router.navigate(['/requests', draft.id]),
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
