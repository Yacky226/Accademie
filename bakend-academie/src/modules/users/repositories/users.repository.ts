import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly rolesRepository: Repository<RoleEntity>,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
    });
  }

  async save(user: UserEntity): Promise<UserEntity> {
    return this.usersRepository.save(user);
  }

  async softDelete(user: UserEntity): Promise<void> {
    await this.usersRepository.softRemove(user);
  }

  async findRolesByNames(roleNames: string[]): Promise<RoleEntity[]> {
    const normalizedNames = roleNames.map((roleName) =>
      roleName.trim().toUpperCase(),
    );
    return this.rolesRepository.find({ where: { name: In(normalizedNames) } });
  }

  async ensureDefaultRoles(): Promise<void> {
    const defaultRoles = [
      { name: 'STUDENT', description: 'Default student role' },
      { name: 'TEACHER', description: 'Teacher role' },
      { name: 'ADMIN', description: 'Administrator role' },
    ];

    for (const role of defaultRoles) {
      const existingRole = await this.rolesRepository.findOne({
        where: { name: role.name },
      });
      if (!existingRole) {
        await this.rolesRepository.save(this.rolesRepository.create(role));
      }
    }
  }
}
