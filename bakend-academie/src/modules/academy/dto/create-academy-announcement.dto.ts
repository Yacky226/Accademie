import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAcademyAnnouncementDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
