import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ArrayNotEmpty } from 'class-validator';
import { Permission, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export class CreateRoleTemplateDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Role)
  baseRole: Role;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
