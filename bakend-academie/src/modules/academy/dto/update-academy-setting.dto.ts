import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAcademySettingDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
