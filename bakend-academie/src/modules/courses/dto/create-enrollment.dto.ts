import { IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  status?: string;
}
