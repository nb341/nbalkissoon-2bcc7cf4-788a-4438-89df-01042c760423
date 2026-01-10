import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization } from '../../entities';
import { LoginDto, RegisterDto } from './dto';
import { Role } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    let organizationId = registerDto.organizationId;

    // Create new organization if name provided and no ID
    if (!organizationId && registerDto.organizationName) {
      const organization = this.organizationRepository.create({
        name: registerDto.organizationName,
      });
      const savedOrg = await this.organizationRepository.save(organization);
      organizationId = savedOrg.id;
    }

    if (!organizationId) {
      throw new ConflictException('Organization ID or name is required');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: registerDto.role || Role.VIEWER,
      organizationId,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role,
      organizationId: savedUser.organizationId,
      createdAt: savedUser.createdAt,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
      expiresIn: 604800,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
