import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GradeEvaluationAttemptDto {
  @IsOptional()
  @IsString()
  graderId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  score!: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
