import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(190)
  slug!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resourceUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationInMinutes?: number;

  @IsNumber()
  @Min(1)
  position!: number;

  @IsOptional()
  @IsBoolean()
  isFreePreview?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
