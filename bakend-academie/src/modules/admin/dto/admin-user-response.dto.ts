export class AdminUserResponseDto {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  status!: string;
  roles!: string[];
  createdAt!: Date;
}
