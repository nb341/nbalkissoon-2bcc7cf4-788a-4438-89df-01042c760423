import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, AuditLog, User } from '../../entities';
import { Role, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: any;
  let auditLogRepository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.ADMIN,
    organizationId: 'org-uuid-123',
  };

  const mockTask = {
    id: 'task-uuid-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    priority: 5,
    createdById: 'user-uuid-123',
    assignedToId: null,
    organizationId: 'org-uuid-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: mockUser,
    assignedTo: null,
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const mockTaskRepository = {
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockAuditLogRepository = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto = {
      title: 'New Task',
      description: 'New Description',
      category: TaskCategory.WORK,
      priority: 3,
    };

    it('should create a task successfully', async () => {
      const savedTask = { ...mockTask, ...createTaskDto };
      taskRepository.create.mockReturnValue(savedTask);
      taskRepository.save.mockResolvedValue(savedTask);
      mockQueryBuilder.getOne.mockResolvedValue(savedTask);

      const result = await service.create(createTaskDto, mockUser as User);

      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        status: TaskStatus.TODO,
        createdById: mockUser.id,
        organizationId: mockUser.organizationId,
      });
      expect(taskRepository.save).toHaveBeenCalled();
      expect(auditLogRepository.create).toHaveBeenCalled();
      expect(result).toEqual(savedTask);
    });

    it('should set default status to TODO', async () => {
      const dtoWithoutStatus = { title: 'Task' };
      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      await service.create(dtoWithoutStatus, mockUser as User);

      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatus.TODO }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const tasks = [mockTask];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([tasks, 1]);

      const result = await service.findAll({}, mockUser as User);

      expect(result.data).toEqual(tasks);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply status filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: TaskStatus.IN_PROGRESS }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.IN_PROGRESS },
      );
    });

    it('should apply category filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ category: TaskCategory.PERSONAL }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.category = :category',
        { category: TaskCategory.PERSONAL },
      );
    });

    it('should apply search filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'test' }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('should apply pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 2, limit: 20 }, mockUser as User);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-uuid-123', mockUser as User);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', mockUser as User),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateTaskDto = { title: 'Updated Task' };

    it('should update a task successfully', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(updatedTask);

      mockQueryBuilder.getOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(updatedTask);

      const result = await service.update(
        'task-uuid-123',
        updateTaskDto,
        mockUser as User,
      );

      expect(taskRepository.save).toHaveBeenCalled();
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for viewer updating others task', async () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER, id: 'other-user' };
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      await expect(
        service.update('task-uuid-123', updateTaskDto, viewerUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a task successfully', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      taskRepository.remove.mockResolvedValue(mockTask);

      await service.remove('task-uuid-123', mockUser as User);

      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(auditLogRepository.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for viewer deleting others task', async () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER, id: 'other-user' };
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      await expect(
        service.remove('task-uuid-123', viewerUser as User),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reorder', () => {
    it('should update task priority', async () => {
      const reorderedTask = { ...mockTask, priority: 10 };
      mockQueryBuilder.getOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(reorderedTask);
      taskRepository.save.mockResolvedValue(reorderedTask);

      const result = await service.reorder('task-uuid-123', 10, mockUser as User);

      expect(taskRepository.save).toHaveBeenCalled();
    });
  });
});
