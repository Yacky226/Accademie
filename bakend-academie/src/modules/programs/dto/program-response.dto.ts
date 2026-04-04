import { ProgramStatus, ProgramStepStatus } from '../../../core/enums';

export class ProgramResponseDto {
  id!: string;
  title!: string;
  description?: string;
  goal?: string;
  status!: ProgramStatus;
  startDate?: Date;
  endDate?: Date;
  student!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  teacher!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  steps!: Array<{
    id: string;
    title: string;
    description?: string;
    position: number;
    status: ProgramStepStatus;
    dueDate?: Date;
    completedAt?: Date;
  }>;
  createdAt!: Date;
  updatedAt!: Date;
}
