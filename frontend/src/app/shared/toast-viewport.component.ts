import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/feedback.service';

@Component({
  selector: 'app-toast-viewport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="toast-viewport" aria-label="Notifications" aria-live="polite">
      @for (toast of toasts.messages(); track toast.id) {
        <article
          class="toast"
          [class.toast--success]="toast.kind === 'success'"
          [class.toast--error]="toast.kind === 'error'"
          [class.toast--info]="toast.kind === 'info'"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
        >
          <span class="toast__icon">{{
            toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i'
          }}</span>
          <div>
            <strong>{{ toast.title }}</strong>
            @if (toast.message) {
              <p>{{ toast.message }}</p>
            }
          </div>
          <button
            type="button"
            class="toast__close"
            (click)="toasts.dismiss(toast.id)"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </article>
      }
    </section>
  `,
})
export class ToastViewportComponent {
  readonly toasts = inject(ToastService);
}
