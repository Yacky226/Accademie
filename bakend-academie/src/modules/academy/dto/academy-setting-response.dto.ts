export class AcademySettingResponseDto {
  id!: string;
  key!: string;
  value!: string;
  description?: string;
  isPublic!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
