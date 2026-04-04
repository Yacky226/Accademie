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

export class CreateProblemDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(190)
  slug!: string;

  @IsString()
  statement!: string;

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

  @IsEnum(ProblemDifficulty)
  difficulty!: ProblemDifficulty;

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

  @IsOptional()
  @IsString()
  creatorId?: string;
}
