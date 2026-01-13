import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../entities';
import { UserStatus, Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user as PENDING with no role', async () => {
      userRepository.findOne!.mockResolvedValue(null);
      userRepository.create!.mockImplementation((dto) => dto);
      userRepository.save!.mockImplementation((user) => Promise.resolve({ id: 'user-id', ...user }));

      const result = await service.register({ email: 'test@test.com', password: 'password123' });

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('approval');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          status: UserStatus.PENDING,
          role: null,
          organizationId: null,
        })
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne!.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register({ email: 'test@test.com', password: 'password123' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: Role.VIEWER,
        status: UserStatus.ACTIVE,
        organizationId: 'org-id',
      };

      userRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: 'password123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 10);
      userRepository.findOne!.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      await expect(service.login({ email: 'test@test.com', password: 'password123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is rejected', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      userRepository.findOne!.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        password: hashedPassword,
        status: UserStatus.REJECTED,
      });

      await expect(service.login({ email: 'test@test.com', password: 'password123' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 'user-id', email: 'test@test.com' };
      userRepository.findOne!.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-id');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      const result = await service.validateUser('user-id');

      expect(result).toBeNull();
    });
  });
});
