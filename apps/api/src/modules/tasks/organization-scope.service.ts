import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities';

type OrgScopeCacheEntry = {
  orgIds: string[];
  expiresAt: number;
};

@Injectable()
export class OrganizationScopeService {
  private cache = new Map<string, OrgScopeCacheEntry>();

  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getOrganizationScope(orgId: string | null): Promise<string[]> {
    if (!orgId) {
      return [];
    }

    const now = Date.now();
    const cached = this.cache.get(orgId);
    const ttlMs = this.getCacheTtlMs();

    if (cached && cached.expiresAt > now) {
      return cached.orgIds;
    }

    const orgs = await this.organizationRepository.find({
      select: ['id', 'parentId'],
    });

    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string | null>();

    for (const org of orgs) {
      parentMap.set(org.id, org.parentId || null);
      if (org.parentId) {
        const children = childrenMap.get(org.parentId) || [];
        children.push(org.id);
        childrenMap.set(org.parentId, children);
      }
    }

    const scopeSet = new Set<string>();

    // Descendants (including self)
    const queue: string[] = [orgId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (scopeSet.has(current)) {
        continue;
      }
      scopeSet.add(current);
      const children = childrenMap.get(current) || [];
      queue.push(...children);
    }

    // Ancestors
    let parent = parentMap.get(orgId) || null;
    while (parent) {
      scopeSet.add(parent);
      parent = parentMap.get(parent) || null;
    }

    const orgIds = Array.from(scopeSet);
    this.cache.set(orgId, { orgIds, expiresAt: now + ttlMs });

    return orgIds;
  }

  private getCacheTtlMs(): number {
    const ttl = parseInt(process.env.ORG_SCOPE_CACHE_TTL_MS || '', 10);
    if (Number.isFinite(ttl) && ttl > 0) {
      return ttl;
    }
    return 5 * 60 * 1000;
  }
}
