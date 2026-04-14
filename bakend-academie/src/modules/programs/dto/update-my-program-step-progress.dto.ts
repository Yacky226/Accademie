import { IsEnum } from 'class-validator';
import { ProgramStepStatus } from '../../../core/enums';

export class UpdateMyProgramStepProgressDto {
  @IsEnum(ProgramStepStatus)
  status!: ProgramStepStatus;
}
