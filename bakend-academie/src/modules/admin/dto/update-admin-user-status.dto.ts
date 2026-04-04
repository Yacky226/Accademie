import { IsEnum } from 'class-validator';
import { UserStatus } from '../../../core/enums';

export class UpdateAdminUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
