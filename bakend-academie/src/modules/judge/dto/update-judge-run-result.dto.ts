import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from '../../../core/enums';

export class UpdateJudgeRunResultDto {
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
  timeMs?: number;

  @IsOptional()
  @IsNumber()
  memoryKb?: number;

  @IsOptional()
  @IsNumber()
  exitCode?: number;
}
