import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EvaluationType } from '../../../core/enums';

export class CreateEvaluationDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(190)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EvaluationType)
  type?: EvaluationType;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationInMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  passScore?: number;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
