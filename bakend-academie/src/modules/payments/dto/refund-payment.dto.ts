import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
