import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="empty">
    <div class="empty__mark"><span></span><span></span><span></span></div>
    <h3>{{ title() }}</h3>
    <p>{{ message() }}</p>
  </div>`,
})
export class EmptyState {
  title = input.required<string>();
  message = input.required<string>();
}
