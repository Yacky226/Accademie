import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProgramStatus } from '../../../core/enums';

export class CreateStudentProgramDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  studentId!: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}
