import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../../store/auth/auth.state';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  csrfToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'access_token';
  private readonly CSRF_TOKEN_KEY = 'csrf_token';
  private readonly USER_KEY = 'user';

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl + '/login', credentials, { withCredentials: true }).pipe(
      tap((response) => this.storeTokens(response))
    );
  }

  register(data: RegisterData): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.apiUrl + '/register', data);
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const csrfToken = this.getCsrfToken();
    return this.http.post<{ accessToken: string; csrfToken: string }>(
      this.apiUrl + '/refresh',
      {},
      {
        withCredentials: true,
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      },
    ).pipe(
      tap((response) => {
        this.setAccessToken(response.accessToken);
        this.setCsrfToken(response.csrfToken);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.apiUrl + '/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearSession();
      }),
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CSRF_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private storeTokens(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.CSRF_TOKEN_KEY, response.csrfToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  private setAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setCsrfToken(token: string): void {
    localStorage.setItem(this.CSRF_TOKEN_KEY, token);
  }

  private getCsrfToken(): string | null {
    return localStorage.getItem(this.CSRF_TOKEN_KEY) || this.getCookieValue('csrf_token');
  }

  private getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
}
