export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

// Role hierarchy: Owner > Admin > Viewer
export const RoleHierarchy: Record<Role, number> = {
  [Role.OWNER]: 3,
  [Role.ADMIN]: 2,
  [Role.VIEWER]: 1,
};
