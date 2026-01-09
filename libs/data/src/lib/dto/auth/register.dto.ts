import { Role } from '../../enums';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  organizationName?: string;
  role?: Role;
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
}
