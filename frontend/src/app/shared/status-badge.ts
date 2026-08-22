import { ChangeDetectionStrategy, Component, input } from '@angular/core';
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="status" [class]="'status status--' + status().toLowerCase()"
    ><span class="status__dot"></span>{{ statusLabel() }}</span
  >`,
})
export class StatusBadge {
  status = input.required<string>();
  statusLabel() {
    return this.status().charAt(0) + this.status().slice(1).toLowerCase();
  }
}
