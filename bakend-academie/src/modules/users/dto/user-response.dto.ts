import { Gender, UserStatus } from '../../../core/enums';

export class UserResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  status!: UserStatus;
  gender?: Gender;
  dateOfBirth?: Date;
  country?: string;
  city?: string;
  onboardingProfile?: Record<string, string>;
  onboardingCompletedAt?: Date;
  emailVerified!: boolean;
  lastLoginAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
  roles!: Array<{ id: string; name: string; description?: string }>;
}
