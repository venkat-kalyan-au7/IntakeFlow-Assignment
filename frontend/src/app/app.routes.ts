import { Routes } from '@angular/router';
import { authGuard, roleGuard, unsavedChangesGuard } from './core/guards';
import { LoginComponent } from './features/auth/login.component';
import { ShellComponent } from './shared/shell.component';
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'forms',
        canActivate: [roleGuard(['ADMIN'])],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/forms/form-studio.component').then((m) => m.FormStudioComponent),
      },
      {
        path: 'requests',
        canActivate: [roleGuard(['REQUESTER'])],
        loadComponent: () =>
          import('./features/requests/requests.component').then((m) => m.RequestsComponent),
      },
      {
        path: 'requests/new/:formId',
        canActivate: [roleGuard(['REQUESTER'])],
        loadComponent: () =>
          import('./features/requests/request-form.component').then((m) => m.RequestFormComponent),
      },
      {
        path: 'requests/:id',
        canActivate: [roleGuard(['REQUESTER', 'ADMIN'])],
        loadComponent: () =>
          import('./features/requests/request-detail.component').then(
            (m) => m.RequestDetailComponent,
          ),
      },
      {
        path: 'review',
        canActivate: [roleGuard(['REVIEWER'])],
        loadComponent: () =>
          import('./features/review/review-queue.component').then((m) => m.ReviewQueueComponent),
      },
      {
        path: 'review/:id',
        canActivate: [roleGuard(['REVIEWER'])],
        loadComponent: () =>
          import('./features/requests/request-detail.component').then(
            (m) => m.RequestDetailComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
