import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApproveUserDto, CreateRoleTemplateDto, UpdateRoleTemplateDto, UpdateUserRoleDto } from './dto';
import { User } from '../../entities';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import {
  Roles,
  RolesGuard,
  CurrentUser,
} from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/auth';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Controller('admin')
@UseGuards(ActiveUserGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('registrations')
  async getPendingRegistrations() {
    return this.adminService.getPendingRegistrations();
  }

  @Post('registrations/:userId/approve')
  async approveUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() approveDto: ApproveUserDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.approveUser(userId, approveDto, user);
  }

  @Post('registrations/:userId/reject')
  async rejectUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.rejectUser(userId);
  }

  @Get('organizations')
  async getOrganizations() {
    return this.adminService.getOrganizations();
  }

  @Get('users')
  async getUsers(@Query('organizationId') organizationId?: string) {
    return this.adminService.getUsers(organizationId);
  }

  @Put('users/:userId/role')
  async updateUserRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdateUserRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateUserRole(userId, updateDto, user);
  }

  @Get('role-templates')
  async getRoleTemplates(@Query('organizationId') organizationId?: string) {
    return this.adminService.getRoleTemplates(organizationId);
  }

  @Post('role-templates')
  async createRoleTemplate(
    @Body() dto: CreateRoleTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.createRoleTemplate(dto, user);
  }

  @Put('role-templates/:templateId')
  async updateRoleTemplate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: UpdateRoleTemplateDto,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateRoleTemplate(templateId, dto, user);
  }

  @Delete('role-templates/:templateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoleTemplate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @CurrentUser() user: User,
  ) {
    await this.adminService.deleteRoleTemplate(templateId, user);
  }
}
