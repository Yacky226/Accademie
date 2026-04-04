import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEvaluationQuestionDto {
  @IsString()
  statement!: string;

  @IsOptional()
  @IsString()
  questionType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  points?: number;

  @IsNumber()
  @Min(1)
  position!: number;
}
