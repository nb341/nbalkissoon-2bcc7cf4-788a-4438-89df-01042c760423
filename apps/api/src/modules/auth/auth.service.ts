import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RefreshToken, User } from '../../entities';
import { LoginDto, RegisterDto } from './dto';
import { UserStatus } from '@nbalkissoon-2bcc7cf4-788a-4438-89df-01042c760423/data';

export type TokenContext = {
  ip?: string | null;
  userAgent?: string | null;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: Partial<User>;
};

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      status: UserStatus.PENDING,
      role: null,
      organizationId: null,
      roleTemplateId: null,
    });

    await this.userRepository.save(user);

    return { message: 'Registration submitted. Please wait for admin approval.' };
  }

  async login(loginDto: LoginDto, context: TokenContext): Promise<LoginResult> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization', 'roleTemplate'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.REJECTED) {
      throw new ForbiddenException('Your account has been rejected');
    }

    const accessToken = this.issueAccessToken(user);
    const { refreshToken, csrfToken } = await this.issueRefreshToken(user, context);

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: this.buildUserResponse(user),
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'roleTemplate'],
    });
  }

  async refreshToken(
    refreshToken: string,
    csrfToken: string,
    context: TokenContext,
  ): Promise<RefreshResult> {
    if (!csrfToken) {
      throw new BadRequestException('Missing CSRF token');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload?.type !== 'refresh' || !payload?.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenIdHash = this.hashTokenId(payload.jti);
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenIdHash },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revokedAt) {
      await this.revokeAllUserTokens(tokenRecord.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.userRepository.findOne({
      where: { id: tokenRecord.userId },
      relations: ['organization', 'roleTemplate'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Your account is not active');
    }

    const accessToken = this.issueAccessToken(user);
    const { refreshToken: newRefreshToken, csrfToken: newCsrfToken, tokenIdHash: newTokenIdHash } =
      await this.issueRefreshToken(user, context);

    await this.rotateRefreshToken(tokenRecord, newTokenIdHash);

    tokenRecord.lastUsedAt = new Date();
    await this.refreshTokenRepository.save(tokenRecord);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken: newCsrfToken,
    };
  }

  async logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
      if (!payload?.jti) {
        return;
      }
      const tokenIdHash = this.hashTokenId(payload.jti);
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { tokenIdHash },
      });
      if (tokenRecord && !tokenRecord.revokedAt) {
        tokenRecord.revokedAt = new Date();
        await this.refreshTokenRepository.save(tokenRecord);
      }
    } catch {
      return;
    }
  }

  private buildUserResponse(user: User): Partial<User> {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      roleTemplateId: user.roleTemplateId,
    };
  }

  private issueAccessToken(user: User): string {
    return this.jwtService.sign(this.buildAccessPayload(user), {
      secret: this.getAccessTokenSecret(),
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as StringValue,
    });
  }

  private async issueRefreshToken(
    user: User,
    context: TokenContext,
  ): Promise<{ refreshToken: string; csrfToken: string; tokenIdHash: string }> {
    const tokenId = crypto.randomUUID();
    const csrfToken = this.generateCsrfToken();
    const refreshSecret = this.getRefreshTokenSecret();
    const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue;

    const refreshToken = this.jwtService.sign(
      {
        ...this.buildAccessPayload(user),
        type: 'refresh',
      },
      {
        secret: refreshSecret,
        expiresIn,
        jwtid: tokenId,
      },
    );

    const tokenIdHash = this.hashTokenId(tokenId);
    const expiresAt = new Date(Date.now() + this.parseDurationMs(expiresIn, 7 * 24 * 60 * 60 * 1000));

    const record = this.refreshTokenRepository.create({
      tokenIdHash,
      userId: user.id,
      expiresAt,
      createdByIp: context.ip || null,
      userAgent: context.userAgent || null,
    });

    await this.refreshTokenRepository.save(record);

    return { refreshToken, csrfToken, tokenIdHash };
  }

  private async rotateRefreshToken(
    tokenRecord: RefreshToken,
    replacedByTokenIdHash: string,
  ): Promise<void> {
    tokenRecord.revokedAt = new Date();
    tokenRecord.replacedByTokenIdHash = replacedByTokenIdHash;
    await this.refreshTokenRepository.save(tokenRecord);
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  private buildAccessPayload(user: User) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      roleTemplateId: user.roleTemplateId,
    };
  }

  private generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private hashTokenId(tokenId: string): string {
    return crypto.createHash('sha256').update(tokenId).digest('hex');
  }

  private parseDurationMs(value: string, fallbackMs: number): number {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
    if (!match) {
      return fallbackMs;
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const multiplier: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * multiplier[unit];
  }

  private getAccessTokenSecret(): string {
    return process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars';
  }

  private getRefreshTokenSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production-min-32-chars';
  }
}
