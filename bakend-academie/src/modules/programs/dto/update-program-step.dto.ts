import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ProgramStepStatus } from '../../../core/enums';

export class UpdateProgramStepDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  position?: number;

  @IsOptional()
  @IsEnum(ProgramStepStatus)
  status?: ProgramStepStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
