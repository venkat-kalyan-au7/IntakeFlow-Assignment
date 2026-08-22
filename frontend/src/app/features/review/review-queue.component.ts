import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Submission, SubmissionStatus } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';
import { EmptyState } from '../../shared/empty-state';
@Component({
  selector: 'app-review-queue',
  imports: [DatePipe, FormsModule, RouterLink, StatusBadge, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page">
    <header class="page-header">
      <div>
        <span class="eyebrow">Decision workspace</span>
        <h1>Review Queue</h1>
        <p>Focus on the requests that are ready for a decision.</p>
      </div>
      <div class="header-stat">
        <span>Awaiting review</span><strong>{{ awaitingCount() }}</strong>
      </div>
    </header>
    <section class="panel">
      <div class="filter-bar">
        <label class="search"
          ><span></span><input [(ngModel)]="query" placeholder="Search request, owner or reference"
        /></label>
        <div class="filter-pills">
          @for (option of filters; track option.value) {
            <button [class.active]="filter() === option.value" (click)="setFilter(option.value)">
              {{ option.label }}
            </button>
          }
        </div>
      </div>
      @if (filtered().length) {
        <div class="review-list">
          @for (item of filtered(); track item.id) {
            <a [routerLink]="['/review', item.id]" class="review-item"
              ><span class="review-item__mark"></span
              ><span class="review-item__main"
                ><small>{{ item.referenceCode }}</small
                ><strong>{{ item.formTitle }}</strong
                ><em>Submitted by {{ item.requesterName }}</em></span
              ><span><app-status-badge [status]="item.status" /></span
              ><span class="review-item__date"
                ><small>Updated</small>{{ item.updatedAt | date: 'MMM d, h:mm a' }}</span
              ><span class="chevron">›</span></a
            >
          }
        </div>
      } @else {
        <app-empty-state
          title="The queue is clear"
          message="No requests match the current filter."
        />
      }
      @if (totalPages() > 1) {
        <nav class="pagination" aria-label="Review queue pages">
          <button
            class="button button--secondary"
            (click)="changePage(page() - 1)"
            [disabled]="page() === 0"
          >
            Previous
          </button>
          <span>Page {{ page() + 1 }} of {{ totalPages() }} · {{ totalElements() }} requests</span>
          <button
            class="button button--secondary"
            (click)="changePage(page() + 1)"
            [disabled]="page() + 1 >= totalPages()"
          >
            Next
          </button>
        </nav>
      }
    </section>
  </main>`,
})
export class ReviewQueueComponent {
  private api = inject(ApiService);
  items = signal<Submission[]>([]);
  filter = signal<SubmissionStatus | ''>('SUBMITTED');
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  awaitingCount = signal(0);
  query = '';
  filters: { label: string; value: SubmissionStatus | '' }[] = [
    { label: 'Needs review', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: '' },
  ];
  constructor() {
    this.load();
    this.api.dashboard().subscribe((x) => this.awaitingCount.set(x.submitted));
  }
  load() {
    this.api.submissions(this.filter() || undefined, this.page()).subscribe((x) => {
      this.items.set(x.content);
      this.totalPages.set(x.totalPages);
      this.totalElements.set(x.totalElements);
    });
  }
  setFilter(v: SubmissionStatus | '') {
    this.filter.set(v);
    this.page.set(0);
    this.load();
  }
  changePage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
  filtered() {
    const q = this.query.toLowerCase().trim();
    return this.items().filter(
      (x) => !q || `${x.referenceCode} ${x.formTitle} ${x.requesterName}`.toLowerCase().includes(q),
    );
  }
}
