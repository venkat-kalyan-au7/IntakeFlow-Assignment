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
      if (error.status === 401 && token) auth.expireSession();
      const detail = error.error?.detail;
      const fallback =
        error.status === 0
          ? 'The service is unavailable. Check your connection and try again.'
          : error.status === 401
            ? 'Check your credentials and try again.'
            : error.status === 403
              ? 'Your account does not have permission for this action.'
              : error.status === 409
                ? 'The current state does not allow this change. Reload the latest information and review the available actions.'
              : 'Please try again. If the problem continues, refresh the page.';
      const title =
        error.error?.title ??
        (error.status === 0
          ? 'Service unavailable'
          : error.status === 409
            ? 'Change could not be saved'
            : 'Request failed');
      toasts.error(title, detail ?? fallback);
      return throwError(() => error);
    }),
    finalize(() => loading.end()),
  );
};
