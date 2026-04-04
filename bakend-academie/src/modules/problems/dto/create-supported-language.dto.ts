import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSupportedLanguageDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(120)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  version?: string;

  @IsOptional()
  @IsNumber()
  judge0LanguageId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
