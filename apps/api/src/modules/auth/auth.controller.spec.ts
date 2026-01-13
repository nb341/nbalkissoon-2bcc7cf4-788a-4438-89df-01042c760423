import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      organizationName: 'Test Org',
    };

    const mockResponse = {
      id: 'user-uuid-123',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: Role.VIEWER,
      organizationId: 'org-uuid-123',
      createdAt: new Date(),
    };

    it('should register a new user', async () => {
      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'user-uuid-123',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.VIEWER,
        organizationId: 'org-uuid-123',
      },
    };

    it('should login user and return tokens', async () => {
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-token';

    const mockResponse = {
      accessToken: 'new-access-token',
    };

    it('should return new access token', async () => {
      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshToken);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockResponse);
    });
  });
});
