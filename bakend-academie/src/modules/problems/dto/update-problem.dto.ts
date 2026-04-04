import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ProblemDifficulty, ProblemStatus } from '../../../core/enums';

export class UpdateProblemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  slug?: string;

  @IsOptional()
  @IsString()
  statement?: string;

  @IsOptional()
  @IsString()
  inputFormat?: string;

  @IsOptional()
  @IsString()
  outputFormat?: string;

  @IsOptional()
  @IsString()
  constraints?: string;

  @IsOptional()
  @IsString()
  sampleInput?: string;

  @IsOptional()
  @IsString()
  sampleOutput?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(ProblemDifficulty)
  difficulty?: ProblemDifficulty;

  @IsOptional()
  @IsEnum(ProblemStatus)
  status?: ProblemStatus;

  @IsOptional()
  @IsNumber()
  @Min(100)
  timeLimitMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(32)
  memoryLimitMb?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
