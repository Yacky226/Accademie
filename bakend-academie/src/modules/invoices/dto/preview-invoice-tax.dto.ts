import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export class PreviewInvoiceTaxDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsIn(['EXEMPT', 'REDUCED_55', 'REDUCED_10', 'STANDARD_20'])
  vatCategory?: 'EXEMPT' | 'REDUCED_55' | 'REDUCED_10' | 'STANDARD_20';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  customTaxRate?: number;
}
