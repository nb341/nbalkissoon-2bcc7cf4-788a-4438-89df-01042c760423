import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { User } from '../../entities';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let auditLogService: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    email: 'owner@test.com',
    firstName: 'Test',
    lastName: 'Owner',
    role: Role.OWNER,
    organizationId: 'org-uuid-123',
  };

  const mockAuditLogService = {
    findAll: jest.fn(),
    getActions: jest.fn(),
    getResources: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const filterDto = { action: 'CREATE', page: 1, limit: 20 };
    const paginatedResponse = {
      data: [
        {
          id: 'audit-uuid-123',
          userId: 'user-uuid-123',
          userEmail: 'owner@test.com',
          userName: 'Test Owner',
          action: 'CREATE',
          resource: 'Task',
          resourceId: 'task-uuid-123',
          createdAt: new Date(),
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };

    it('should return paginated audit logs', async () => {
      mockAuditLogService.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(filterDto, mockUser as User);

      expect(auditLogService.findAll).toHaveBeenCalledWith(filterDto, mockUser);
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('getActions', () => {
    it('should return distinct actions', async () => {
      const actions = ['CREATE', 'UPDATE', 'DELETE'];
      mockAuditLogService.getActions.mockResolvedValue(actions);

      const result = await controller.getActions();

      expect(auditLogService.getActions).toHaveBeenCalled();
      expect(result).toEqual(actions);
    });
  });

  describe('getResources', () => {
    it('should return distinct resources', async () => {
      const resources = ['Task', 'User'];
      mockAuditLogService.getResources.mockResolvedValue(resources);

      const result = await controller.getResources();

      expect(auditLogService.getResources).toHaveBeenCalled();
      expect(result).toEqual(resources);
    });
  });
});
