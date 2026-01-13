export enum Permission {
  // Task permissions
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',

  // Organization permissions
  ORG_MANAGE = 'org:manage',
  ORG_VIEW = 'org:view',

  // User permissions
  USER_MANAGE = 'user:manage',
  USER_VIEW = 'user:view',

  // Audit permissions
  AUDIT_VIEW = 'audit:view',
}

// Default permissions per role
export const RolePermissions: Record<string, Permission[]> = {
  owner: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.ORG_MANAGE,
    Permission.ORG_VIEW,
    Permission.USER_MANAGE,
    Permission.USER_VIEW,
    Permission.AUDIT_VIEW,
  ],
  admin: [
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.ORG_VIEW,
    Permission.USER_VIEW,
    Permission.AUDIT_VIEW,
  ],
  viewer: [
    Permission.TASK_READ,
    Permission.ORG_VIEW,
  ],
};
