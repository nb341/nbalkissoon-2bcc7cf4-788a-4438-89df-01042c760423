import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, User } from '../../entities';
import { AuditFilterDto } from './dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(filterDto: AuditFilterDto, user: User) {
    const query = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .where('user.organizationId = :orgId', { orgId: user.organizationId });

    // Apply filters
    if (filterDto.userId) {
      query.andWhere('audit.userId = :userId', { userId: filterDto.userId });
    }

    if (filterDto.action) {
      query.andWhere('audit.action = :action', { action: filterDto.action });
    }

    if (filterDto.resource) {
      query.andWhere('audit.resource = :resource', { resource: filterDto.resource });
    }

    if (filterDto.resourceId) {
      query.andWhere('audit.resourceId = :resourceId', { resourceId: filterDto.resourceId });
    }

    if (filterDto.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: filterDto.startDate });
    }

    if (filterDto.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: filterDto.endDate });
    }

    // Apply sorting
    const sortOrder = filterDto.sortOrder || 'DESC';
    query.orderBy('audit.createdAt', sortOrder);

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map(log => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.user?.email,
        userName: log.user ? log.user.firstName + ' ' + log.user.lastName : null,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getActions(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.action', 'action')
      .getRawMany();

    return result.map(r => r.action);
  }

  async getResources(): Promise<string[]> {
    const result = await this.auditLogRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.resource', 'resource')
      .getRawMany();

    return result.map(r => r.resource);
  }
}
