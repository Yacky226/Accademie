import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ProviderWebhookDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  eventType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  object?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  api_version?: string;

  @IsOptional()
  @IsNumber()
  created?: number;

  @IsOptional()
  @IsBoolean()
  livemode?: boolean;

  @IsOptional()
  @IsNumber()
  pending_webhooks?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  providerTransactionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  request?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  account?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  context?: string;
}
