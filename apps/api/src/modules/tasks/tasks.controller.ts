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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto';
import { User } from '../../entities';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import {
  Roles,
  Permissions,
  CurrentUser,
  RolesGuard,
  PermissionsGuard,
} from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/auth';
import { Role, Permission } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Controller('tasks')
@UseGuards(ActiveUserGuard, RolesGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.TASK_CREATE)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @Permissions(Permission.TASK_READ)
  async findAll(
    @Query() filterDto: TaskFilterDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.findAll(filterDto, user);
  }

  @Get(':id')
  @Permissions(Permission.TASK_READ)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.findOne(id, user);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.TASK_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.TASK_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.remove(id, user);
  }

  @Put(':id/reorder')
  @Roles(Role.OWNER, Role.ADMIN)
  @Permissions(Permission.TASK_UPDATE)
  async reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('priority') priority: number,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.reorder(id, priority, user);
  }
}
