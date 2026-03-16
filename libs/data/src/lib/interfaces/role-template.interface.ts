import { Permission, Role } from '../enums';

export interface IRoleTemplate {
  id: string;
  name: string;
  description?: string | null;
  baseRole: Role;
  permissions: Permission[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}
