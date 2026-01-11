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

    return this.findOneById(savedTask.id);
  }

  async findAll(filterDto: TaskFilterDto, user: User) {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo');

    // Apply organization and visibility scope based on role
    this.applyVisibilityScope(query, user);

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
    const task = await this.findOneById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check visibility
    if (!this.canViewTask(task, user)) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOneById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check update permission (B2 override: Admin can update any task in their org)
    if (!this.canModifyTask(task, user)) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    const oldValue = { ...task };

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    await this.logAudit(user.id, 'UPDATE', 'Task', id, oldValue, updatedTask);

    return this.findOneById(id);
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOneById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check delete permission (B2 override: Admin can delete any task in their org)
    if (!this.canModifyTask(task, user)) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.logAudit(user.id, 'DELETE', 'Task', id, task, null);

    await this.taskRepository.remove(task);
  }

  async reorder(id: string, newPriority: number, user: User): Promise<Task> {
    const task = await this.findOneById(id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!this.canModifyTask(task, user)) {
      throw new ForbiddenException('You do not have permission to reorder this task');
    }

    task.priority = newPriority;
    await this.taskRepository.save(task);

    return this.findOneById(id);
  }

  private async findOneById(id: string): Promise<Task | null> {
    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.id = :id', { id })
      .getOne();
  }

  private applyVisibilityScope(query: SelectQueryBuilder<Task>, user: User): void {
    // Owner can see all tasks in org hierarchy
    if (user.role === Role.OWNER) {
      query.andWhere('task.organizationId = :orgId', { orgId: user.organizationId });
      return;
    }

    // Admin can see all tasks in org
    if (user.role === Role.ADMIN) {
      query.andWhere('task.organizationId = :orgId', { orgId: user.organizationId });
      return;
    }

    // Viewer: can only see tasks they created OR are assigned to
    query.andWhere('task.organizationId = :orgId', { orgId: user.organizationId });
    query.andWhere(
      '(task.createdById = :userId OR task.assignedToId = :userId)',
      { userId: user.id },
    );
  }

  private canViewTask(task: Task, user: User): boolean {
    // Must be same org
    if (task.organizationId !== user.organizationId) {
      return false;
    }

    // Owner can view all tasks in org
    if (user.role === Role.OWNER) {
      return true;
    }

    // Admin and Viewer: can only view if creator or assignee
    return task.createdById === user.id || task.assignedToId === user.id;
  }

  private canModifyTask(task: Task, user: User): boolean {
    // Must be same org
    if (task.organizationId !== user.organizationId) {
      return false;
    }

    // Owner can modify all tasks in org
    if (user.role === Role.OWNER) {
      return true;
    }

    // Admin can modify any task in their org (B2 override)
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Viewer cannot modify tasks
    return false;
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
