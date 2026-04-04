import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHashService } from '../auth/services/password-hash.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RoleEntity } from './entities/role.entity';
import { UserEntity } from './entities/user.entity';
import { UserSelfOrAdminGuard } from './guards/user-self-or-admin.guard';
import { UsersRepository } from './repositories/users.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
	imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, RefreshTokenEntity])],
	controllers: [UsersController],
	providers: [UsersService, UsersRepository, PasswordHashService, UserSelfOrAdminGuard],
	exports: [UsersService, UsersRepository],
})
export class UsersModule {}

