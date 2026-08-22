import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { FormDefinition, Submission } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';
import { EmptyState } from '../../shared/empty-state';
@Component({
  selector: 'app-requests',
  imports: [RouterLink, DatePipe, StatusBadge, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page">
    <header class="page-header">
      <div>
        <span class="eyebrow">Your workspace</span>
        <h1>Requests</h1>
        <p>Start a new request or continue where you left off.</p>
      </div>
    </header>
    <section class="section-block">
      <div class="section-heading">
        <div>
          <h2>Start a request</h2>
          <p>Choose a published form from your workspace.</p>
        </div>
      </div>
      <div class="form-gallery">
        @if (loadingForms()) {
          <div class="list-loading" aria-live="polite">Loading available forms…</div>
        } @else if (formsError()) {
          <div class="page-state page-state--embedded" role="alert">
            <h3>Forms unavailable</h3>
            <p>{{ formsError() }}</p>
            <button class="button button--secondary" (click)="loadForms()">Try again</button>
          </div>
        } @else {
          @for (form of forms(); track form.id) {
            <a class="form-card" [routerLink]="['/requests/new', form.id]"
              ><span class="form-card__mark"><i></i><i></i><i></i></span>
              <div>
                <span class="eyebrow">Published form</span>
                <h3>{{ form.title }}</h3>
                <p>{{ form.description }}</p>
              </div>
              <span class="form-card__arrow">→</span></a
            >
          } @empty {
            <app-empty-state
              title="No forms available"
              message="Published forms will appear here when your workspace is ready."
            />
          }
        }
      </div>
    </section>
    <section class="panel">
      <header class="panel__header">
        <div>
          <h2>My requests</h2>
          <p>Track drafts and submitted work in one place.</p>
        </div>
      </header>
      @if (loadingItems()) {
        <div class="list-loading" aria-live="polite">Loading your requests…</div>
      } @else if (itemsError()) {
        <div class="page-state page-state--embedded" role="alert">
          <h3>Requests unavailable</h3>
          <p>{{ itemsError() }}</p>
          <button class="button button--secondary" (click)="load()">Try again</button>
        </div>
      } @else if (items().length) {
        <div class="request-table">
          <div class="request-table__head">
            <span>Request</span><span>Status</span><span>Created</span><span>Updated</span>
          </div>
          @for (item of items(); track item.id) {
            <a class="request-row request-row--four" [routerLink]="['/requests', item.id]"
              ><span
                ><strong>{{ item.formTitle }}</strong
                ><small>{{ item.referenceCode }}</small></span
              ><span><app-status-badge [status]="item.status" /></span
              ><span>{{ item.createdAt | date: 'MMM d, y' }}</span
              ><span>{{ item.updatedAt | date: 'MMM d, h:mm a' }}</span></a
            >
          }
        </div>
        @if (totalPages() > 1) {
          <nav class="pagination" aria-label="My requests pages">
            <button
              class="button button--secondary"
              (click)="changePage(page() - 1)"
              [disabled]="page() === 0"
            >
              Previous
            </button>
            <span
              >Page {{ page() + 1 }} of {{ totalPages() }} · {{ totalElements() }} requests</span
            >
            <button
              class="button button--secondary"
              (click)="changePage(page() + 1)"
              [disabled]="page() + 1 >= totalPages()"
            >
              Next
            </button>
          </nav>
        }
      } @else {
        <app-empty-state
          title="No requests yet"
          message="Choose a form above to create your first request."
        />
      }
    </section>
  </main>`,
})
export class RequestsComponent {
  private api = inject(ApiService);
  forms = signal<FormDefinition[]>([]);
  items = signal<Submission[]>([]);
  loadingForms = signal(true);
  loadingItems = signal(true);
  formsError = signal('');
  itemsError = signal('');
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  constructor() {
    this.loadForms();
    this.load();
  }
  loadForms() {
    this.loadingForms.set(true);
    this.formsError.set('');
    this.api.publishedForms().subscribe({
      next: (x) => {
        this.forms.set(x);
        this.loadingForms.set(false);
      },
      error: () => {
        this.loadingForms.set(false);
        this.formsError.set('We could not load published forms.');
      },
    });
  }
  load() {
    this.loadingItems.set(true);
    this.itemsError.set('');
    this.api.submissions(undefined, this.page()).subscribe({
      next: (x) => {
        this.items.set(x.content);
        this.totalPages.set(x.totalPages);
        this.totalElements.set(x.totalElements);
        this.loadingItems.set(false);
      },
      error: () => {
        this.loadingItems.set(false);
        this.itemsError.set('We could not load your requests.');
      },
    });
  }
  changePage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.load();
  }
}
