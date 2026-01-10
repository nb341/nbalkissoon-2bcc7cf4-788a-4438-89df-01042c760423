import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, Organization } from '../../entities';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let organizationRepository: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword123',
    role: Role.VIEWER,
    organizationId: 'org-uuid-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganization = {
    id: 'org-uuid-123',
    name: 'Test Organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockOrganizationRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      organizationName: 'New Organization',
    };

    it('should register a new user with a new organization', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.create.mockReturnValue(mockOrganization);
      organizationRepository.save.mockResolvedValue(mockOrganization);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(organizationRepository.create).toHaveBeenCalledWith({
        name: registerDto.organizationName,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if no organization provided', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const dtoWithoutOrg = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      await expect(service.register(dtoWithoutOrg)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should register user with existing organization ID', async () => {
      const dtoWithOrgId = {
        ...registerDto,
        organizationId: 'existing-org-id',
        organizationName: undefined,
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(dtoWithOrgId);

      expect(organizationRepository.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should return tokens and user data on successful login', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        organization: mockOrganization,
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-uuid-123');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-123' },
        relations: ['organization'],
      });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid-123' });
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(jwtService.verify).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 'nonexistent-id' });
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
