import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('Auth Guards', () => {
  let authService: { isAuthenticated: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(() => {
    authService = { isAuthenticated: jest.fn() };
    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('guestGuard', () => {
    it('should allow access when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
