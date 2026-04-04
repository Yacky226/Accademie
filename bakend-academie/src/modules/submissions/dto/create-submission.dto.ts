import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  sourceCode!: string;

  @IsOptional()
  @IsString()
  stdin?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsString()
  problemId?: string;

  @IsOptional()
  @IsString()
  languageId?: string;

  @IsOptional()
  @IsString()
  judgeRunId?: string;
}
