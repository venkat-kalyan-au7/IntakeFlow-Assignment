import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/feedback.service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="login-page">
    <section class="login-brand" aria-label="About IntakeFlow">
      <a class="brand brand--light" href="/login"
        ><span class="brand__mark">I</span><span>IntakeFlow</span></a
      >
      <div class="login-brand__copy">
        <span class="eyebrow eyebrow--light">Structured intake. Clear decisions.</span>
        <h1>Move every request<br />forward with confidence.</h1>
        <p>
          Build flexible intake forms, keep review work focused, and give every stakeholder a clear
          view of progress.
        </p>
      </div>
      <div class="trust-row">
        <div><strong>One workspace</strong><span>Forms, requests and reviews</span></div>
        <div><strong>Built for clarity</strong><span>Every decision is traceable</span></div>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <div class="mobile-brand">
          <span class="brand__mark">I</span><strong>IntakeFlow</strong>
        </div>
        <span class="eyebrow">Welcome back</span>
        <h2>Sign in to your workspace</h2>
        <p class="muted">Use your work account to continue.</p>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label
            >Email address<input
              type="email"
              formControlName="email"
              autocomplete="username"
              placeholder="you@company.com"
            /><span
              class="field-error"
              [class.visible]="form.controls.email.touched && form.controls.email.invalid"
              >Enter a valid email address</span
            ></label
          ><label
            >Password<input
              type="password"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Enter your password"
            /><span
              class="field-error"
              [class.visible]="form.controls.password.touched && form.controls.password.invalid"
              >Password is required</span
            ></label
          >
          @if (error()) {
            <div class="alert alert--error" role="alert">{{ error() }}</div>
          }
          <button class="button button--primary button--wide" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <div class="demo-access">
          <span>Demo workspace</span><button type="button" (click)="use('admin')">Admin</button
          ><button type="button" (click)="use('requester')">Requester</button
          ><button type="button" (click)="use('reviewer')">Reviewer</button>
        </div>
        <p class="security-note"><span class="lock"></span>Secured access · Activity is audited</p>
      </div>
    </section>
  </main>`,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toasts = inject(ToastService);
  loading = signal(false);
  error = signal('');
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  use(role: string) {
    this.form.setValue({ email: `${role}@intakeflow.demo`, password: 'IntakeFlow@2026' });
    this.submit();
  }
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue().email, this.form.getRawValue().password).subscribe({
      next: (response) => {
        this.toasts.success('Welcome back', `Signed in as ${response.user.displayName}.`);
        void this.router.navigateByUrl('/dashboard');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(
          e.error?.detail ?? 'We could not sign you in. Check your details and try again.',
        );
      },
    });
  }
}
