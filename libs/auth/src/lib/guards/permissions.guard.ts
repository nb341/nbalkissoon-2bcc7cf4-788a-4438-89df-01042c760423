import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, RolePermissions } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

type PermissionCacheEntry = {
  permissions: Permission[];
  expiresAt: number;
  key: string;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private static cache = new Map<string, PermissionCacheEntry>();

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    const userPermissions = this.getCachedPermissions(user);

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }

  private getCachedPermissions(user: any): Permission[] {
    const ttlMs = this.getCacheTtlMs();
    const cacheKey = this.buildCacheKey(user);
    const existing = PermissionsGuard.cache.get(user.id);
    const now = Date.now();

    if (existing && existing.key === cacheKey && existing.expiresAt > now) {
      return existing.permissions;
    }

    const permissions =
      user?.roleTemplate?.permissions?.length
        ? user.roleTemplate.permissions
        : RolePermissions[user?.role] || [];

    PermissionsGuard.cache.set(user.id, {
      permissions,
      expiresAt: now + ttlMs,
      key: cacheKey,
    });

    return permissions;
  }

  private buildCacheKey(user: any): string {
    const roleTemplateId = user?.roleTemplateId || user?.roleTemplate?.id || 'none';
    const roleTemplateUpdatedAt = user?.roleTemplate?.updatedAt
      ? new Date(user.roleTemplate.updatedAt).toISOString()
      : 'none';
    return `${user?.role || 'none'}:${roleTemplateId}:${roleTemplateUpdatedAt}`;
  }

  private getCacheTtlMs(): number {
    const ttl = parseInt(process.env.PERMISSIONS_CACHE_TTL_MS || '', 10);
    if (Number.isFinite(ttl) && ttl > 0) {
      return ttl;
    }
    return 5 * 60 * 1000;
  }
}
