import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProblemTestCaseDto {
  @IsString()
  input!: string;

  @IsString()
  expectedOutput!: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  points?: number;

  @IsNumber()
  @Min(1)
  position!: number;
}
