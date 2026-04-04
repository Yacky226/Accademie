import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubscriptionPaymentDto {
  @IsString()
  @MaxLength(100)
  planCode!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingInterval?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @IsOptional()
  @IsDateString()
  nextBillingAt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
