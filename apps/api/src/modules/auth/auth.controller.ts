import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, Headers, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, {
      ip: this.getRequestIp(req),
      userAgent: req.headers['user-agent'] || null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    this.setCsrfCookie(res, result.csrfToken);

    return {
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-csrf-token') csrfHeader: string,
  ) {
    const cookies = this.parseCookies(req.headers.cookie);
    const refreshToken = cookies['refresh_token'];
    const csrfCookie = cookies['csrf_token'];

    if (!refreshToken) {
      throw new BadRequestException('Missing refresh token');
    }

    if (!csrfHeader || csrfHeader !== csrfCookie) {
      throw new BadRequestException('Invalid CSRF token');
    }

    const result = await this.authService.refreshToken(refreshToken, csrfHeader, {
      ip: this.getRequestIp(req),
      userAgent: req.headers['user-agent'] || null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    this.setCsrfCookie(res, result.csrfToken);

    return {
      accessToken: result.accessToken,
      csrfToken: result.csrfToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = this.parseCookies(req.headers.cookie);
    const refreshToken = cookies['refresh_token'] || null;
    await this.authService.logout(refreshToken);
    this.clearAuthCookies(res);
  }

  private parseCookies(cookieHeader?: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) {
      return cookies;
    }
    for (const part of cookieHeader.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (!key) {
        continue;
      }
      cookies[key] = decodeURIComponent(rest.join('='));
    }
    return cookies;
  }

  private setRefreshCookie(res: Response, token: string): void {
    const maxAge = this.getRefreshTokenMaxAgeMs();
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/api/auth',
      maxAge,
    });
  }

  private setCsrfCookie(res: Response, token: string): void {
    const maxAge = this.getRefreshTokenMaxAgeMs();
    res.cookie('csrf_token', token, {
      httpOnly: false,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/api/auth',
      maxAge,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 0,
    });
    res.cookie('csrf_token', '', {
      httpOnly: false,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 0,
    });
  }

  private isSecureCookie(): boolean {
    return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  }

  private getRefreshTokenMaxAgeMs(): number {
    const value = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
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

  private getRequestIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || null;
  }
}
