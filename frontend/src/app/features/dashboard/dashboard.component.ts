import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Dashboard } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';
import { EmptyState } from '../../shared/empty-state';
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, StatusBadge, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page">
    <header class="page-header">
      <div>
        <span class="eyebrow">{{ today | date: 'EEEE, MMMM d' }}</span>
        <h1>Good {{ greeting() }}, {{ firstName() }}</h1>
        <p>{{ subtitle() }}</p>
      </div>
      <a class="button button--primary" [routerLink]="primaryLink()"
        ><span class="button__plus">+</span>{{ primaryLabel() }}</a
      >
    </header>
    @if (loading()) {
      <div class="metrics skeleton-row"><span></span><span></span><span></span><span></span></div>
    } @else if (data(); as d) {
      <section class="metrics" aria-label="Request summary">
        <article>
          <span class="metric-icon metric-icon--draft"></span>
          <div>
            <span>Drafts</span><strong>{{ d.drafts }}</strong>
          </div>
          <small>In progress</small>
        </article>
        <article>
          <span class="metric-icon metric-icon--submitted"></span>
          <div>
            <span>Submitted</span><strong>{{ d.submitted }}</strong>
          </div>
          <small>Awaiting review</small>
        </article>
        <article>
          <span class="metric-icon metric-icon--approved"></span>
          <div>
            <span>Approved</span><strong>{{ d.approved }}</strong>
          </div>
          <small>Completed</small>
        </article>
        <article>
          <span class="metric-icon metric-icon--rejected"></span>
          <div>
            <span>Needs attention</span><strong>{{ d.rejected }}</strong>
          </div>
          <small>Updates requested</small>
        </article>
      </section>
      <section class="dashboard-grid">
        <article class="panel panel--recent">
          <header class="panel__header">
            <div>
              <h2>Recent activity</h2>
              <p>Requests updated across your workspace</p>
            </div>
            <a [routerLink]="listLink()">View all</a>
          </header>
          @if (d.recent.length) {
            <div class="request-table">
              <div class="request-table__head">
                <span>Request</span><span>Owner</span><span>Status</span><span>Updated</span>
              </div>
              @for (item of d.recent; track item.id) {
                <a class="request-row" [routerLink]="detailLink(item.id)"
                  ><span
                    ><strong>{{ item.formTitle }}</strong
                    ><small>{{ item.referenceCode }}</small></span
                  ><span>{{ item.requesterName }}</span
                  ><span><app-status-badge [status]="item.status" /></span
                  ><span>{{ item.updatedAt | date: 'MMM d, h:mm a' }}</span></a
                >
              }
            </div>
          } @else {
            <app-empty-state
              title="Nothing here yet"
              message="Activity will appear as requests move through the workspace."
            />
          }
        </article>
        <aside class="panel focus-panel">
          <span class="eyebrow">At a glance</span>
          <h2>{{ focusTitle() }}</h2>
          <p>{{ focusMessage() }}</p>
          <div class="donut" [style.--value]="completion()">
            <div>
              <strong>{{ completion() }}%</strong><span>resolved</span>
            </div>
          </div>
          <dl>
            <div>
              <dt><span class="legend legend--submitted"></span>Awaiting review</dt>
              <dd>{{ d.submitted }}</dd>
            </div>
            <div>
              <dt><span class="legend legend--approved"></span>Approved</dt>
              <dd>{{ d.approved }}</dd>
            </div>
            <div>
              <dt><span class="legend legend--rejected"></span>Needs attention</dt>
              <dd>{{ d.rejected }}</dd>
            </div>
          </dl>
        </aside>
      </section>
    }
  </main>`,
})
export class DashboardComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  loading = signal(true);
  data = signal<Dashboard | null>(null);
  today = new Date();
  constructor() {
    this.api.dashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  firstName() {
    return this.auth.user()?.displayName.split(' ')[0] ?? 'there';
  }
  greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }
  subtitle() {
    return this.auth.user()?.role === 'REVIEWER'
      ? 'Here is what needs your attention today.'
      : this.auth.user()?.role === 'ADMIN'
        ? 'Here is how your intake workspace is performing.'
        : 'Here is the latest on your requests.';
  }
  primaryLabel() {
    return this.auth.user()?.role === 'ADMIN'
      ? 'Create form'
      : this.auth.user()?.role === 'REVIEWER'
        ? 'Open review queue'
        : 'New request';
  }
  primaryLink() {
    return this.auth.user()?.role === 'ADMIN'
      ? '/forms'
      : this.auth.user()?.role === 'REVIEWER'
        ? '/review'
        : '/requests';
  }
  listLink() {
    return this.auth.user()?.role === 'REVIEWER'
      ? '/review'
      : this.auth.user()?.role === 'ADMIN'
        ? '/forms'
        : '/requests';
  }
  detailLink(id: number) {
    return this.auth.user()?.role === 'REVIEWER' ? ['/review', id] : ['/requests', id];
  }
  focusTitle() {
    return this.auth.user()?.role === 'REVIEWER' ? 'Review throughput' : 'Request health';
  }
  focusMessage() {
    return this.auth.user()?.role === 'REVIEWER'
      ? 'A clear view of decisions across the current queue.'
      : 'A concise view of resolved and open requests.';
  }
  completion() {
    const d = this.data();
    if (!d) return 0;
    const total = d.submitted + d.approved + d.rejected;
    return total ? Math.round((d.approved / total) * 100) : 0;
  }
}
