import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentStatus } from '../../../core/enums';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(190)
  providerTransactionId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subscriptionPlanCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  subscriptionStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingInterval?: string;

  @IsOptional()
  @IsDateString()
  nextBillingAt?: string;
}
