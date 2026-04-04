import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  type?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  score!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  maxScore!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsString()
  gradedAt?: string;

  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  gradedById?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  evaluationAttemptId?: string;
}
