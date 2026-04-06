import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from '../../core/guards/jwt-refresh.guard';
import { RateLimitGuard } from '../../core/guards/rate-limit.guard';
import { TokenService } from './services/token.service';
import { Reflector } from '@nestjs/core';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        {
          provide: JwtRefreshGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: RateLimitGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        { provide: TokenService, useValue: { verifyRefreshToken: jest.fn() } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
