import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export const ORG_ACCESS_KEY = 'orgAccess';

export interface OrgAccessOptions {
  allowParentOrg?: boolean;
  allowChildOrg?: boolean;
  paramName?: string;
}

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<OrgAccessOptions>(
      ORG_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no org access options specified, allow access
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      return false;
    }

    // Owners can access everything within their org hierarchy
    if (user.role === Role.OWNER) {
      return true;
    }

    const resourceOrgId = this.getResourceOrgId(request, options.paramName);

    if (!resourceOrgId) {
      return true;
    }

    // Check if user belongs to the same organization
    if (user.organizationId === resourceOrgId) {
      return true;
    }

    // Check parent/child org access if enabled
    if (options.allowParentOrg || options.allowChildOrg) {
      return this.checkOrgHierarchy(user, resourceOrgId, options);
    }

    return false;
  }

  private getResourceOrgId(request: any, paramName?: string): string | null {
    const param = paramName || 'organizationId';
    return (
      request.params?.[param] ||
      request.body?.[param] ||
      request.query?.[param] ||
      null
    );
  }

  private checkOrgHierarchy(
    user: any,
    resourceOrgId: string,
    options: OrgAccessOptions,
  ): boolean {
    // If user has organization loaded with parent/children
    if (user.organization) {
      if (options.allowParentOrg && user.organization.parentId === resourceOrgId) {
        return true;
      }
      if (options.allowChildOrg && user.organization.children) {
        return user.organization.children.some(
          (child: any) => child.id === resourceOrgId,
        );
      }
    }
    return false;
  }
}
