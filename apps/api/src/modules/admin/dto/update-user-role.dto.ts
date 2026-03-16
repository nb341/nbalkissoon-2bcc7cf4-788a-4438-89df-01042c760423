import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsUUID()
  roleTemplateId?: string;
}
