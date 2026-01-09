import { Role } from '../enums';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithOrg extends IUserResponse {
  organization: {
    id: string;
    name: string;
    parentId?: string;
  };
}
