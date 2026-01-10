import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog, User } from '../../entities';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.OWNER,
    organizationId: 'org-uuid-123',
  };

  const mockAuditLog = {
    id: 'audit-uuid-123',
    userId: 'user-uuid-123',
    action: 'CREATE',
    resource: 'Task',
    resourceId: 'task-uuid-123',
    oldValue: null,
    newValue: { title: 'New Task' },
    ipAddress: '127.0.0.1',
    userAgent: 'TestAgent',
    createdAt: new Date(),
    user: mockUser,
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const mockAuditLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const logs = [mockAuditLog];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([logs, 1]);

      const result = await service.findAll({}, mockUser as User);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('userEmail');
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by userId', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ userId: 'user-123' }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.userId = :userId',
        { userId: 'user-123' },
      );
    });

    it('should filter by action', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ action: 'CREATE' }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.action = :action',
        { action: 'CREATE' },
      );
    });

    it('should filter by resource', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ resource: 'Task' }, mockUser as User);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.resource = :resource',
        { resource: 'Task' },
      );
    });

    it('should filter by date range', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(
        { startDate: '2026-01-01', endDate: '2026-01-31' },
        mockUser as User,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.createdAt >= :startDate',
        { startDate: '2026-01-01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.createdAt <= :endDate',
        { endDate: '2026-01-31' },
      );
    });

    it('should apply pagination', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 2, limit: 10 }, mockUser as User);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should scope to user organization', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({}, mockUser as User);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.organizationId = :orgId',
        { orgId: 'org-uuid-123' },
      );
    });
  });

  describe('create', () => {
    it('should create an audit log entry', async () => {
      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.create(
        'user-uuid-123',
        'CREATE',
        'Task',
        'task-uuid-123',
        null,
        { title: 'New Task' },
        '127.0.0.1',
        'TestAgent',
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId: 'user-uuid-123',
        action: 'CREATE',
        resource: 'Task',
        resourceId: 'task-uuid-123',
        oldValue: null,
        newValue: { title: 'New Task' },
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent',
      });
      expect(auditLogRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('getActions', () => {
    it('should return distinct actions', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { action: 'CREATE' },
        { action: 'UPDATE' },
        { action: 'DELETE' },
      ]);

      const result = await service.getActions();

      expect(result).toEqual(['CREATE', 'UPDATE', 'DELETE']);
    });
  });

  describe('getResources', () => {
    it('should return distinct resources', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { resource: 'Task' },
        { resource: 'User' },
      ]);

      const result = await service.getResources();

      expect(result).toEqual(['Task', 'User']);
    });
  });
});
