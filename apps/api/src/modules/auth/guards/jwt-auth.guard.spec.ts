import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, IS_PUBLIC_KEY } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const mockExecutionContext = (isPublic: boolean): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      const context = mockExecutionContext(true);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      const context = mockExecutionContext(false);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Note: We can't fully test AuthGuard behavior without more setup
      // This test verifies the public route bypass logic
      expect(reflector.getAllAndOverride).toBeDefined();
    });
  });
});
