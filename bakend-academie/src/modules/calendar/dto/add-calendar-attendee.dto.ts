import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddCalendarAttendeeDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  responseStatus?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
