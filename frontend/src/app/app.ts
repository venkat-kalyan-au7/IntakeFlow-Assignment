import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/feedback.service';
import { ToastViewportComponent } from './shared/toast-viewport.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastViewportComponent],
  template: `
    <div class="global-progress" [class.global-progress--visible]="loading.visible()">
      <span></span>
    </div>
    <router-outlet />
    <app-toast-viewport />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly loading = inject(LoadingService);
}
