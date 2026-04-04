import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtRefreshGuard } from '../../core/guards/jwt-refresh.guard';
import { RefreshTokenEntity } from '../users/entities/refresh-token.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_USERS_REPOSITORY } from './repositories/auth-users.repository';
import { TypeOrmAuthUsersRepository } from './repositories/typeorm-auth-users.repository';
import { PasswordHashService } from './services/password-hash.service';
import { TokenService } from './services/token.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity, RoleEntity, RefreshTokenEntity]),
		JwtModule.register({
			secret: process.env.JWT_SECRET ?? 'change-me',
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		PasswordHashService,
		TokenService,
		JwtRefreshGuard,
		TypeOrmAuthUsersRepository,
		{
			provide: AUTH_USERS_REPOSITORY,
			useExisting: TypeOrmAuthUsersRepository,
		},
	],
	exports: [AuthService, TokenService, AUTH_USERS_REPOSITORY],
})
export class AuthModule {}

