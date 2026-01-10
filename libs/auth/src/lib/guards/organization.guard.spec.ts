import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationGuard, ORG_ACCESS_KEY } from './organization.guard';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('OrganizationGuard', () => {
  let guard: OrganizationGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new OrganizationGuard(reflector);
  });

  const createMockContext = (user: any, params = {}, body = {}, query = {}): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user, params, body, query }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when no org access options are specified', () => {
      const context = createMockContext({ role: Role.VIEWER, organizationId: 'org-1' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true for owner regardless of org', () => {
      const context = createMockContext(
        { role: Role.OWNER, organizationId: 'org-1' },
        { organizationId: 'org-2' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when user belongs to the same org', () => {
      const context = createMockContext(
        { role: Role.ADMIN, organizationId: 'org-1' },
        { organizationId: 'org-1' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user belongs to different org', () => {
      const context = createMockContext(
        { role: Role.ADMIN, organizationId: 'org-1' },
        { organizationId: 'org-2' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when no user is present', () => {
      const context = createMockContext(null, { organizationId: 'org-1' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when no resource org ID is found', () => {
      const context = createMockContext({ role: Role.VIEWER, organizationId: 'org-1' });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should get org ID from body when not in params', () => {
      const context = createMockContext(
        { role: Role.ADMIN, organizationId: 'org-1' },
        {},
        { organizationId: 'org-1' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should get org ID from query when not in params or body', () => {
      const context = createMockContext(
        { role: Role.ADMIN, organizationId: 'org-1' },
        {},
        {},
        { organizationId: 'org-1' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({});

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow parent org access when enabled', () => {
      const context = createMockContext(
        {
          role: Role.ADMIN,
          organizationId: 'org-child',
          organization: { parentId: 'org-parent' },
        },
        { organizationId: 'org-parent' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        allowParentOrg: true,
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow child org access when enabled', () => {
      const context = createMockContext(
        {
          role: Role.ADMIN,
          organizationId: 'org-parent',
          organization: { children: [{ id: 'org-child' }] },
        },
        { organizationId: 'org-child' },
      );
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        allowChildOrg: true,
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
