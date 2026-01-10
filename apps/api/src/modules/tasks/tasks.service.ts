import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task, User, AuditLog } from '../../entities';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './dto';
import { Role, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      status: createTaskDto.status || TaskStatus.TODO,
      category: createTaskDto.category || TaskCategory.OTHER,
      priority: createTaskDto.priority || 0,
      createdById: user.id,
      organizationId: user.organizationId,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.logAudit(user.id, 'CREATE', 'Task', savedTask.id, null, savedTask);

    return this.findOne(savedTask.id, user);
  }

  async findAll(filterDto: TaskFilterDto, user: User) {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo');

    // Apply organization scope based on role
    this.applyOrgScope(query, user);

    // Apply filters
    this.applyFilters(query, filterDto);

    // Apply sorting
    const sortBy = filterDto.sortBy || 'createdAt';
    const sortOrder = filterDto.sortOrder || 'DESC';
    query.orderBy('task.' + sortBy, sortOrder);

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: User): Promise<Task> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.id = :id', { id });

    this.applyOrgScope(query, user);

    const task = await query.getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    // Check if user can update this task
    this.checkUpdatePermission(task, user);

    const oldValue = { ...task };

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    await this.logAudit(user.id, 'UPDATE', 'Task', id, oldValue, updatedTask);

    return this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // Check if user can delete this task
    this.checkDeletePermission(task, user);

    await this.logAudit(user.id, 'DELETE', 'Task', id, task, null);

    await this.taskRepository.remove(task);
  }

  async reorder(id: string, newPriority: number, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    this.checkUpdatePermission(task, user);

    task.priority = newPriority;
    await this.taskRepository.save(task);

    return this.findOne(id, user);
  }

  private applyOrgScope(query: SelectQueryBuilder<Task>, user: User): void {
    // All users can only see tasks within their organization
    query.andWhere('task.organizationId = :orgId', { orgId: user.organizationId });

    // Viewers can only see tasks assigned to them or created by them
    if (user.role === Role.VIEWER) {
      query.andWhere(
        '(task.createdById = :userId OR task.assignedToId = :userId)',
        { userId: user.id },
      );
    }
  }

  private applyFilters(query: SelectQueryBuilder<Task>, filterDto: TaskFilterDto): void {
    if (filterDto.status) {
      query.andWhere('task.status = :status', { status: filterDto.status });
    }

    if (filterDto.category) {
      query.andWhere('task.category = :category', { category: filterDto.category });
    }

    if (filterDto.assignedToId) {
      query.andWhere('task.assignedToId = :assignedToId', {
        assignedToId: filterDto.assignedToId,
      });
    }

    if (filterDto.createdById) {
      query.andWhere('task.createdById = :createdById', {
        createdById: filterDto.createdById,
      });
    }

    if (filterDto.search) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: '%' + filterDto.search + '%' },
      );
    }
  }

  private checkUpdatePermission(task: Task, user: User): void {
    // Owners and Admins can update any task in their org
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      return;
    }

    // Viewers can only update tasks they created or are assigned to
    if (task.createdById !== user.id && task.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this task');
    }
  }

  private checkDeletePermission(task: Task, user: User): void {
    // Only Owners and Admins can delete tasks
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      return;
    }

    // Viewers can only delete tasks they created
    if (task.createdById !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }
  }

  private async logAudit(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    oldValue: any,
    newValue: any,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
    });

    await this.auditLogRepository.save(auditLog);
  }
}
