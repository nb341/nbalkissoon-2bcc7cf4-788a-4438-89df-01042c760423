import { IsUUID, IsEnum } from 'class-validator';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export class ApproveUserDto {
  @IsUUID()
  organizationId: string;

  @IsEnum(Role)
  role: Role;
}
