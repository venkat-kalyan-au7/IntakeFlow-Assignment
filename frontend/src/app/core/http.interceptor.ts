import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { LoadingService, ToastService } from './feedback.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const loading = inject(LoadingService);
  const toasts = inject(ToastService);
  const token = auth.token;
  const nextRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
  loading.begin();
  return next(nextRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) auth.logout();
      const detail = error.error?.detail;
      const fallback =
        error.status === 0
          ? 'The service is unavailable. Check your connection and try again.'
          : error.status === 401
            ? 'Check your credentials and try again.'
            : error.status === 403
              ? 'Your account does not have permission for this action.'
              : 'Please try again. If the problem continues, refresh the page.';
      toasts.error(error.error?.title ?? 'Request failed', detail ?? fallback);
      return throwError(() => error);
    }),
    finalize(() => loading.end()),
  );
};
