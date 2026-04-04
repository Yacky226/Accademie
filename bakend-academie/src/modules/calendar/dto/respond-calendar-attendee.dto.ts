import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RespondCalendarAttendeeDto {
  @IsString()
  @MaxLength(20)
  responseStatus!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
