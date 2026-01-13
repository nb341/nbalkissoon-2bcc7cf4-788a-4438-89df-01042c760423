import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { User } from '../../entities';
import { Role, TaskStatus, TaskCategory } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: any;

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
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto = {
      title: 'New Task',
      description: 'New Description',
      category: TaskCategory.WORK,
    };

    it('should create a task', async () => {
      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, mockUser as User);

      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    const filterDto = { status: TaskStatus.TODO, page: 1, limit: 10 };
    const paginatedResponse = {
      data: [mockTask],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };

    it('should return paginated tasks', async () => {
      mockTasksService.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(filterDto, mockUser as User);

      expect(tasksService.findAll).toHaveBeenCalledWith(filterDto, mockUser);
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('task-uuid-123', mockUser as User);

      expect(tasksService.findOne).toHaveBeenCalledWith('task-uuid-123', mockUser);
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    const updateTaskDto = { title: 'Updated Task' };

    it('should update a task', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(
        'task-uuid-123',
        updateTaskDto,
        mockUser as User,
      );

      expect(tasksService.update).toHaveBeenCalledWith(
        'task-uuid-123',
        updateTaskDto,
        mockUser,
      );
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);

      await controller.remove('task-uuid-123', mockUser as User);

      expect(tasksService.remove).toHaveBeenCalledWith('task-uuid-123', mockUser);
    });
  });

  describe('reorder', () => {
    it('should reorder a task', async () => {
      const reorderedTask = { ...mockTask, priority: 10 };
      mockTasksService.reorder.mockResolvedValue(reorderedTask);

      const result = await controller.reorder(
        'task-uuid-123',
        10,
        mockUser as User,
      );

      expect(tasksService.reorder).toHaveBeenCalledWith(
        'task-uuid-123',
        10,
        mockUser,
      );
      expect(result).toEqual(reorderedTask);
    });
  });
});
