import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user() ? true : inject(Router).createUrlTree(['/login']);
};
export const roleGuard =
  (roles: Role[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return auth.user() && roles.includes(auth.user()!.role)
      ? true
      : inject(Router).createUrlTree(['/dashboard']);
  };

export interface UnsavedChangesAware {
  canDeactivate(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesAware> = (component) =>
  component.canDeactivate();
