import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="app-shell" [class.nav-open]="navOpen()">
    <aside class="sidebar">
      <div class="sidebar__top">
        <a class="brand" routerLink="/dashboard" (click)="navOpen.set(false)"
          ><span class="brand__mark">I</span><span>IntakeFlow</span></a
        ><button
          class="icon-button sidebar__close"
          (click)="navOpen.set(false)"
          aria-label="Close navigation"
        >
          ×
        </button>
      </div>
      <nav aria-label="Main navigation">
        <span class="nav-label">Workspace</span
        ><a routerLink="/dashboard" routerLinkActive="active" (click)="navOpen.set(false)"
          ><span class="nav-icon dashboard-icon"></span>Overview</a
        >
        @if (auth.user()?.role === 'ADMIN') {
          <a routerLink="/forms" routerLinkActive="active" (click)="navOpen.set(false)"
            ><span class="nav-icon form-icon"></span>Form Studio</a
          >
        }
        @if (auth.user()?.role === 'REQUESTER') {
          <a routerLink="/requests" routerLinkActive="active" (click)="navOpen.set(false)"
            ><span class="nav-icon request-icon"></span>Requests</a
          >
        }
        @if (auth.user()?.role === 'REVIEWER') {
          <a routerLink="/review" routerLinkActive="active" (click)="navOpen.set(false)"
            ><span class="nav-icon review-icon"></span>Review Queue</a
          >
        }
      </nav>
      <div class="sidebar__footer">
        <div class="profile">
          <span class="avatar">{{ initials() }}</span>
          <div>
            <strong>{{ auth.user()?.displayName }}</strong
            ><span>{{ roleLabel() }}</span>
          </div>
        </div>
        <button class="text-button" (click)="auth.logout()">Sign out</button>
      </div>
    </aside>
    <div class="scrim" (click)="navOpen.set(false)"></div>
    <div class="workspace">
      <header class="topbar">
        <button
          class="icon-button menu-button"
          (click)="navOpen.set(true)"
          aria-label="Open navigation"
        >
          <span></span>
        </button>
        <div class="topbar__context">
          <span>IntakeFlow workspace</span><strong>{{ roleLabel() }}</strong>
        </div>
        <div class="topbar__right">
          <button
            type="button"
            class="account-button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            [attr.aria-expanded]="accountOpen()"
            (click)="toggleAccount($event)"
          >
            <span class="avatar avatar--small" aria-hidden="true">{{ initials() }}</span>
            <span class="account-button__chevron" aria-hidden="true"></span>
          </button>
          @if (accountOpen()) {
            <div class="account-menu" role="menu" (click)="$event.stopPropagation()">
              <div class="account-menu__identity">
                <strong>{{ auth.user()?.displayName }}</strong>
                <span>{{ roleLabel() }}</span>
              </div>
              <button type="button" role="menuitem" (click)="logout()">
                <span class="account-menu__logout-icon" aria-hidden="true"></span>
                Logout
              </button>
            </div>
          }
        </div>
      </header>
      <router-outlet />
    </div>
  </div>`,
})
export class ShellComponent {
  auth = inject(AuthService);
  navOpen = signal(false);
  accountOpen = signal(false);

  toggleAccount(event: MouseEvent) {
    event.stopPropagation();
    this.accountOpen.update((open) => !open);
  }

  logout() {
    this.accountOpen.set(false);
    this.auth.logout();
  }

  @HostListener('document:click')
  closeAccountMenu() {
    this.accountOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  closeAccountMenuOnEscape() {
    this.accountOpen.set(false);
  }

  initials() {
    return (
      this.auth
        .user()
        ?.displayName.split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ?? 'IF'
    );
  }
  roleLabel() {
    return ({ ADMIN: 'Administrator', REQUESTER: 'Requester', REVIEWER: 'Reviewer' } as const)[
      this.auth.user()?.role ?? 'REQUESTER'
    ];
  }
}
