import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, User } from './models';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly user = signal<User | null>(this.readUser());
  get token() {
    return sessionStorage.getItem('intakeflow_token');
  }
  login(email: string, password: string) {
    return this.http.post<AuthResponse>('/api/v1/auth/login', { email, password }).pipe(
      tap((r) => {
        sessionStorage.setItem('intakeflow_token', r.token);
        sessionStorage.setItem('intakeflow_user', JSON.stringify(r.user));
        this.user.set(r.user);
      }),
    );
  }
  logout() {
    void this.router.navigateByUrl('/login').then((navigated) => {
      if (navigated) this.clearSession();
    });
  }
  expireSession() {
    this.clearSession();
    window.location.assign('/login');
  }
  private clearSession() {
    sessionStorage.removeItem('intakeflow_token');
    sessionStorage.removeItem('intakeflow_user');
    this.user.set(null);
  }
  private readUser(): User | null {
    try {
      return JSON.parse(sessionStorage.getItem('intakeflow_user') ?? 'null') as User | null;
    } catch {
      return null;
    }
  }
}
