import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitEvaluationAttemptDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown>;
}
