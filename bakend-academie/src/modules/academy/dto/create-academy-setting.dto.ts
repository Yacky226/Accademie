import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAcademySettingDto {
  @IsString()
  @MaxLength(120)
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
