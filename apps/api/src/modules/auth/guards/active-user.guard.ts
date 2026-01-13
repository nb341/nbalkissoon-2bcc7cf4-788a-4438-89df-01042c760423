import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'ACCOUNT_PENDING_APPROVAL',
        error: 'Your account is pending approval. Please wait for an administrator to approve your registration.',
      });
    }

    if (user.status === UserStatus.REJECTED) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'ACCOUNT_REJECTED',
        error: 'Your account has been rejected.',
      });
    }

    return true;
  }
}
