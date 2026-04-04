import { IsNumber, Max, Min } from 'class-validator';

export class UpdateEnrollmentProgressDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  progressPercent!: number;
}
