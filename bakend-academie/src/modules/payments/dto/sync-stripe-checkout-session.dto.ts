import { IsString, MaxLength } from 'class-validator';

export class SyncStripeCheckoutSessionDto {
  @IsString()
  @MaxLength(200)
  sessionId!: string;
}
