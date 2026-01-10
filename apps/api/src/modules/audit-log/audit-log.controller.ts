import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditFilterDto } from './dto';
import { User } from '../../entities';
import {
  Roles,
  Permissions,
  CurrentUser,
  RolesGuard,
  PermissionsGuard,
} from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/auth';
import { Role, Permission } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Controller('audit-log')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles(Role.OWNER, Role.ADMIN)
@Permissions(Permission.AUDIT_VIEW)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(
    @Query() filterDto: AuditFilterDto,
    @CurrentUser() user: User,
  ) {
    return this.auditLogService.findAll(filterDto, user);
  }

  @Get('actions')
  async getActions() {
    return this.auditLogService.getActions();
  }

  @Get('resources')
  async getResources() {
    return this.auditLogService.getResources();
  }
}
