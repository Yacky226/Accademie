import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseModuleDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  position!: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
