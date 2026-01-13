import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApproveUserDto } from './dto';
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
}
