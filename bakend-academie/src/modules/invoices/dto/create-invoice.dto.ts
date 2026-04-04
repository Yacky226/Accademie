import {
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vatCategory?: 'EXEMPT' | 'REDUCED_55' | 'REDUCED_10' | 'STANDARD_20';

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  customerCompanyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerVatNumber?: string;

  @IsOptional()
  @IsString()
  taxExemptionReason?: string;
}
