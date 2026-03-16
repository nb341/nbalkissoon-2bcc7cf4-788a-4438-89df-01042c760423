import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { Permission, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export class UpdateRoleTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Role)
  baseRole?: Role;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}
