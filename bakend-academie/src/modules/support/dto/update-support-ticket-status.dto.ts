import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SUPPORT_TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export class UpdateSupportTicketStatusDto {
  @IsString()
  @IsIn(SUPPORT_TICKET_STATUSES)
  status!: (typeof SUPPORT_TICKET_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  resolution?: string;
}
