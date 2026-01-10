import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, RoleHierarchy } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Check if user has any of the required roles or higher
    return requiredRoles.some((requiredRole) => 
      this.hasRoleOrHigher(user.role, requiredRole)
    );
  }

  private hasRoleOrHigher(userRole: Role, requiredRole: Role): boolean {
    const userRoleLevel = RoleHierarchy[userRole] || 0;
    const requiredRoleLevel = RoleHierarchy[requiredRole] || 0;
    return userRoleLevel >= requiredRoleLevel;
  }
}
