import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SubmissionStatus } from '../../../core/enums';

export class UpdateSubmissionResultDto {
  @IsOptional()
  @IsString()
  stdout?: string;

  @IsOptional()
  @IsString()
  stderr?: string;

  @IsOptional()
  @IsString()
  compileOutput?: string;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsString()
  verdict?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  timeMs?: number;

  @IsOptional()
  @IsNumber()
  memoryKb?: number;

  @IsOptional()
  @IsNumber()
  exitCode?: number;
}
