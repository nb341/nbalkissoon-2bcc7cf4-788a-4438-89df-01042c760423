import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    parentId?: string;
    children?: { id: string; name: string }[];
  };
}
