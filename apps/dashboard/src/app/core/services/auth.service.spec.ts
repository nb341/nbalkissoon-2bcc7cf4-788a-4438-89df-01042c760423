import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockLoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'user-123',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
      organizationId: 'org-123',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login and store tokens', () => {
      const credentials = { email: 'test@test.com', password: 'password123' };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('access_token')).toBe('mock-access-token');
        expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockLoginResponse);
    });
  });

  describe('register', () => {
    it('should register a new user', () => {
      const registerData = {
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationName: 'Test Org',
      };

      const mockResponse = {
        id: 'user-456',
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'owner',
        organizationId: 'org-456',
        createdAt: new Date(),
      };

      service.register(registerData).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear tokens from localStorage', () => {
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');
      localStorage.setItem('user', JSON.stringify({ id: '123' }));

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
      const expiredToken = 'header.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
      localStorage.setItem('access_token', expiredToken);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when token is valid', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      const validToken = 'header.' + btoa(JSON.stringify(validPayload)) + '.signature';
      localStorage.setItem('access_token', validToken);

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('getUser', () => {
    it('should return null when no user stored', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should return user when stored', () => {
      const user = { id: '123', email: 'test@test.com' };
      localStorage.setItem('user', JSON.stringify(user));

      expect(service.getUser()).toEqual(user);
    });
  });
});
