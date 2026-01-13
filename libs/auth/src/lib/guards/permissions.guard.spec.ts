import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Role, Permission } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
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
    it('should return true when no permissions are required', () => {
      const context = createMockContext({ role: Role.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when owner has all permissions', () => {
      const context = createMockContext({ role: Role.OWNER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_CREATE,
        Permission.TASK_DELETE,
      ]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when admin has task permissions', () => {
      const context = createMockContext({ role: Role.ADMIN });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_CREATE,
        Permission.TASK_READ,
      ]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when viewer tries to create task', () => {
      const context = createMockContext({ role: Role.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_CREATE,
      ]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when viewer has read permission', () => {
      const context = createMockContext({ role: Role.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_READ,
      ]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when no user is present', () => {
      const context = createMockContext(null);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_READ,
      ]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when admin tries to manage org', () => {
      const context = createMockContext({ role: Role.ADMIN });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.ORG_MANAGE,
      ]);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when owner manages org', () => {
      const context = createMockContext({ role: Role.OWNER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.ORG_MANAGE,
      ]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should require all permissions when multiple are specified', () => {
      const context = createMockContext({ role: Role.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Permission.TASK_READ,
        Permission.TASK_CREATE,
      ]);

      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
