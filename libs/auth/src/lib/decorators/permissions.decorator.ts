import { SetMetadata } from '@nestjs/common';
import { Permission } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
