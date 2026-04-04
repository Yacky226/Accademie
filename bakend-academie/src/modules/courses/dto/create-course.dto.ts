import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CourseLevel, CourseStatus } from '../../../core/enums';

export class CreateCourseDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(190)
  slug!: string;

  @IsString()
  @MaxLength(255)
  shortDescription!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  thumbnailUrl?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsString()
  @MaxLength(10)
  currency!: string;

  @IsEnum(CourseLevel)
  level!: CourseLevel;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationInHours?: number;

  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @IsOptional()
  @IsString()
  creatorId?: string;
}
