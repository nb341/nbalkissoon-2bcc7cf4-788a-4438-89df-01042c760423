import { Role, RoleHierarchy, Permission, RolePermissions, TaskStatus, TaskCategory } from './index';

describe('Data Library', () => {
  describe('Role Enum', () => {
    it('should have correct role values', () => {
      expect(Role.OWNER).toBe('owner');
      expect(Role.ADMIN).toBe('admin');
      expect(Role.VIEWER).toBe('viewer');
    });

    it('should have correct role hierarchy', () => {
      expect(RoleHierarchy[Role.OWNER]).toBe(3);
      expect(RoleHierarchy[Role.ADMIN]).toBe(2);
      expect(RoleHierarchy[Role.VIEWER]).toBe(1);
    });
  });

  describe('Permission Enum', () => {
    it('should have task permissions', () => {
      expect(Permission.TASK_CREATE).toBe('task:create');
      expect(Permission.TASK_READ).toBe('task:read');
      expect(Permission.TASK_UPDATE).toBe('task:update');
      expect(Permission.TASK_DELETE).toBe('task:delete');
    });

    it('should have org permissions', () => {
      expect(Permission.ORG_MANAGE).toBe('org:manage');
      expect(Permission.ORG_VIEW).toBe('org:view');
    });
  });

  describe('RolePermissions', () => {
    it('should give owner all permissions', () => {
      expect(RolePermissions['owner']).toContain(Permission.TASK_CREATE);
      expect(RolePermissions['owner']).toContain(Permission.ORG_MANAGE);
      expect(RolePermissions['owner']).toContain(Permission.AUDIT_VIEW);
    });

    it('should give admin limited permissions', () => {
      expect(RolePermissions['admin']).toContain(Permission.TASK_CREATE);
      expect(RolePermissions['admin']).not.toContain(Permission.ORG_MANAGE);
      expect(RolePermissions['admin']).toContain(Permission.AUDIT_VIEW);
    });

    it('should give viewer read-only permissions', () => {
      expect(RolePermissions['viewer']).toContain(Permission.TASK_READ);
      expect(RolePermissions['viewer']).not.toContain(Permission.TASK_CREATE);
      expect(RolePermissions['viewer']).not.toContain(Permission.AUDIT_VIEW);
    });
  });

  describe('TaskStatus Enum', () => {
    it('should have correct status values', () => {
      expect(TaskStatus.TODO).toBe('todo');
      expect(TaskStatus.IN_PROGRESS).toBe('in_progress');
      expect(TaskStatus.COMPLETED).toBe('completed');
      expect(TaskStatus.ARCHIVED).toBe('archived');
    });
  });

  describe('TaskCategory Enum', () => {
    it('should have correct category values', () => {
      expect(TaskCategory.WORK).toBe('work');
      expect(TaskCategory.PERSONAL).toBe('personal');
      expect(TaskCategory.URGENT).toBe('urgent');
      expect(TaskCategory.OTHER).toBe('other');
    });
  });
});
