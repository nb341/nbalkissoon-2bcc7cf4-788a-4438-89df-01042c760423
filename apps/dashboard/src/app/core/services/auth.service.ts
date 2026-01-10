import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginDto, LoginResponseDto, RegisterDto, RegisterResponseDto } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  constructor(private http: HttpClient) {}

  login(credentials: LoginDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(this.apiUrl + '/login', credentials).pipe(
      tap((response) => this.storeTokens(response))
    );
  }

  register(data: RegisterDto): Observable<RegisterResponseDto> {
    return this.http.post<RegisterResponseDto>(this.apiUrl + '/register', data);
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ accessToken: string }>(this.apiUrl + '/refresh', { refreshToken }).pipe(
      tap((response) => this.setAccessToken(response.accessToken))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
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

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): LoginResponseDto['user'] | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private storeTokens(response: LoginResponseDto): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  private setAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}
