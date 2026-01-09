import { Permission, Role } from '../enums';

export interface IPermission {
  id: string;
  name: Permission;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRolePermission {
  id: string;
  role: Role;
  permissionId: string;
  permission?: IPermission;
  createdAt: Date;
}
