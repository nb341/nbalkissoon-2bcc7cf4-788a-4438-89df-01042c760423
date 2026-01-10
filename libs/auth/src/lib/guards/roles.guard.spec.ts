import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const context = createMockContext({ role: Role.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when user has the required role', () => {
      const context = createMockContext({ role: Role.ADMIN });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when user has a higher role than required', () => {
      const context = createMockContext({ role: Role.OWNER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user has a lower role than required', () => {
      const context = createMockContext({ role: Role.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when no user is present', () => {
      const context = createMockContext(null);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      const context = createMockContext({ role: Role.ADMIN });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER, Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should use role hierarchy - owner can access admin routes', () => {
      const context = createMockContext({ role: Role.OWNER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should use role hierarchy - admin can access viewer routes', () => {
      const context = createMockContext({ role: Role.ADMIN });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
